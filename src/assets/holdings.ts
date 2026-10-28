/**
 * 一条资产。
 *
 * 金额口径（写进 CONTEXT.md）：
 *   - 现金 / 存款 / 货币基金 / 债券 / 其他：`amount` 就是当前金额，计入总资产。
 *   - 股票 / 基金：`amount` 是成本；若同时填了份额与现价，`marketValue = 份额 × 现价`
 *     计入总资产，`amount` 只用来算浮动。没填份额与现价时退回 `amount`。
 *   这样「改现价 → 总资产跟着变」是对的，而不是两个数打架。
 */

import { allowsUnits, DEFAULT_CATEGORY_ID, isCategoryId } from './categories'
import { parseNumericInput } from '../kernel/parse'

export interface AssetItem {
  id: string
  name: string
  /** 类别 id，见 categories.ts */
  category: string
  /** 金额（元）。股票/基金里它是成本 */
  amount: number
  /** 份额，只有股票/基金可能非空 */
  units: number | null
  /** 现价，只有股票/基金可能非空 */
  price: number | null
  createdAt: number
  updatedAt: number
}

/** 表单原始文本，不解析；编辑时用 itemToDraft 回填 */
export interface AssetDraft {
  name: string
  category: string
  amount: string
  units: string
  price: string
}

export type AssetDraftField = 'name' | 'category' | 'amount' | 'units' | 'price'
export type AssetDraftErrors = Partial<Record<AssetDraftField, string>>

export const NAME_MAX_LENGTH = 40

export function emptyDraft(category: string = DEFAULT_CATEGORY_ID): AssetDraft {
  return { name: '', category, amount: '', units: '', price: '' }
}

export function itemToDraft(item: AssetItem): AssetDraft {
  return {
    name: item.name,
    category: item.category,
    amount: String(item.amount),
    units: item.units === null ? '' : String(item.units),
    price: item.price === null ? '' : String(item.price),
  }
}

/** 计入总资产的值：有份额与现价就按市值，否则用金额 */
export function marketValue(item: AssetItem): number {
  if (item.units !== null && item.price !== null) return item.units * item.price
  return item.amount
}

/** 浮动 = 市值 − 成本（没有份额/现价时为 0） */
export function floating(item: AssetItem): number {
  return marketValue(item) - item.amount
}

export function validateDraft(draft: AssetDraft): AssetDraftErrors {
  const errors: AssetDraftErrors = {}

  const name = draft.name.trim()
  if (name === '') {
    errors.name = '请填名称'
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `名称不超过 ${NAME_MAX_LENGTH} 字`
  }

  if (!isCategoryId(draft.category)) errors.category = '请选类别'

  const amount = parseNumericInput(draft.amount)
  if (amount.error === 'not-a-number') {
    errors.amount = '请输入数字'
  } else if (amount.value === null) {
    errors.amount = '请填金额'
  } else if (amount.value <= 0) {
    errors.amount = '金额需大于 0'
  } else if (amount.value > Number.MAX_SAFE_INTEGER) {
    errors.amount = '金额过大'
  }

  // 份额与现价只对股票/基金有意义；切到其他类别时表单里残留的值直接忽略
  if (allowsUnits(draft.category)) {
    const unitsText = draft.units.trim()
    const priceText = draft.price.trim()
    const units = parseNumericInput(unitsText)
    const price = parseNumericInput(priceText)

    if (unitsText !== '' && units.error === 'not-a-number') errors.units = '请输入数字'
    if (priceText !== '' && price.error === 'not-a-number') errors.price = '请输入数字'

    const unitsGiven = units.value !== null
    const priceGiven = price.value !== null
    if (unitsGiven !== priceGiven) {
      const message = '份额与现价要一起填'
      if (unitsGiven) errors.price = message
      else errors.units = message
    } else {
      if (unitsGiven && units.value !== null && units.value <= 0) errors.units = '份额需大于 0'
      if (priceGiven && price.value !== null && price.value <= 0) errors.price = '现价需大于 0'
    }
  }

  return errors
}

export function hasErrors(errors: AssetDraftErrors): boolean {
  return Object.keys(errors).length > 0
}

export function draftToItem(
  draft: AssetDraft,
  meta: { id: string; now: number; createdAt?: number | undefined },
): AssetItem | null {
  if (hasErrors(validateDraft(draft))) return null

  const amount = parseNumericInput(draft.amount).value
  if (amount === null) return null

  const withUnits = allowsUnits(draft.category)
  const units = withUnits ? parseNumericInput(draft.units).value : null
  const price = withUnits ? parseNumericInput(draft.price).value : null

  return {
    id: meta.id,
    name: draft.name.trim().slice(0, NAME_MAX_LENGTH),
    category: draft.category,
    amount,
    units,
    price,
    createdAt: meta.createdAt ?? meta.now,
    updatedAt: meta.now,
  }
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function isOptionalPositive(value: unknown): boolean {
  return value === null || isPositiveNumber(value)
}

export function isAssetItem(value: unknown): value is AssetItem {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  if (
    typeof candidate.id !== 'string' ||
    candidate.id === '' ||
    typeof candidate.name !== 'string' ||
    candidate.name.trim() === '' ||
    typeof candidate.category !== 'string' ||
    !isCategoryId(candidate.category) ||
    !isPositiveNumber(candidate.amount) ||
    !isOptionalPositive(candidate.units) ||
    !isOptionalPositive(candidate.price) ||
    typeof candidate.createdAt !== 'number' ||
    !Number.isFinite(candidate.createdAt) ||
    typeof candidate.updatedAt !== 'number' ||
    !Number.isFinite(candidate.updatedAt)
  ) {
    return false
  }
  // 份额与现价必须成对，且只能出现在股票/基金上
  const units = candidate.units
  const price = candidate.price
  if ((units === null) !== (price === null)) return false
  if (units !== null && !allowsUnits(candidate.category)) return false
  return true
}

/** 读存储：坏条目逐条丢掉，不整页崩 */
export function parseItems(value: unknown): AssetItem[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const items: AssetItem[] = []
  for (const candidate of value) {
    if (!isAssetItem(candidate) || seen.has(candidate.id)) continue
    seen.add(candidate.id)
    items.push(candidate)
  }
  return items
}

export function newAssetId(): string {
  const cryptoApi = globalThis.crypto
  if (cryptoApi !== undefined && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

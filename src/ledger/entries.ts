/**
 * 记账条目：一条支出记录。
 *
 * L1 只记支出（分类表也是支出分类），没有收入、没有账户、没有转账。
 * 这条边界写在 CONTEXT.md；要加收入先改 issue，不要在这里偷偷加字段。
 */

import { DEFAULT_CATEGORY_ID, isCategoryId } from './categories'
import { isValidISODate } from './dates'
import { parseNumericInput } from '../kernel/parse'

export interface LedgerEntry {
  id: string
  /** 金额（元），> 0 */
  amount: number
  /** 分类 id，见 categories.ts */
  category: string
  /** 记账日期 'YYYY-MM-DD'（本地日） */
  date: string
  /** 备注，可为空串 */
  note: string
  /** 创建时间戳，同一天内排序用 */
  createdAt: number
}

/** 表单里的原始文本，不解析 */
export interface EntryDraft {
  amount: string
  category: string
  date: string
  note: string
}

export type EntryDraftField = 'amount' | 'category' | 'date'
export type EntryDraftErrors = Partial<Record<EntryDraftField, string>>

export const NOTE_MAX_LENGTH = 60

export function emptyDraft(today: string): EntryDraft {
  return { amount: '', category: DEFAULT_CATEGORY_ID, date: today, note: '' }
}

/**
 * 校验草稿。`today` 由调用方传入，便于测试。
 * 金额为 0、为空、非数字都不允许保存（0 元支出没有意义）。
 */
export function validateDraft(draft: EntryDraft, today: string): EntryDraftErrors {
  const errors: EntryDraftErrors = {}

  const parsed = parseNumericInput(draft.amount)
  if (parsed.error === 'not-a-number') {
    errors.amount = '请输入数字'
  } else if (parsed.value === null) {
    errors.amount = '请填金额'
  } else if (parsed.value <= 0) {
    errors.amount = '金额需大于 0'
  } else if (parsed.value > Number.MAX_SAFE_INTEGER) {
    errors.amount = '金额过大'
  }

  if (!isCategoryId(draft.category)) errors.category = '请选分类'

  if (!isValidISODate(draft.date)) {
    errors.date = '请填有效日期'
  } else if (draft.date > today) {
    errors.date = '日期不能晚于今天'
  }

  return errors
}

export function hasErrors(errors: EntryDraftErrors): boolean {
  return Object.keys(errors).length > 0
}

/** 校验通过后把草稿变成条目；不通过返回 null（调用方已经展示过错误） */
export function draftToEntry(
  draft: EntryDraft,
  meta: { id: string; createdAt: number; today: string },
): LedgerEntry | null {
  if (hasErrors(validateDraft(draft, meta.today))) return null
  const amount = parseNumericInput(draft.amount).value
  if (amount === null) return null
  return {
    id: meta.id,
    amount,
    category: draft.category,
    date: draft.date,
    note: draft.note.trim().slice(0, NOTE_MAX_LENGTH),
    createdAt: meta.createdAt,
  }
}

function isFinitePositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

/** 读存储时的逐条校验：坏条目直接丢掉，不让整个列表崩掉 */
export function isLedgerEntry(value: unknown): value is LedgerEntry {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    candidate.id !== '' &&
    isFinitePositive(candidate.amount) &&
    typeof candidate.category === 'string' &&
    isCategoryId(candidate.category) &&
    typeof candidate.date === 'string' &&
    isValidISODate(candidate.date) &&
    typeof candidate.note === 'string' &&
    typeof candidate.createdAt === 'number' &&
    Number.isFinite(candidate.createdAt)
  )
}

export function parseEntries(value: unknown): LedgerEntry[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const entries: LedgerEntry[] = []
  for (const item of value) {
    if (!isLedgerEntry(item) || seen.has(item.id)) continue
    seen.add(item.id)
    entries.push(item)
  }
  return entries
}

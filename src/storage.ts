/**
 * localStorage 持久化。
 *
 * 只存用户敲进去的原始文本（string），不存计算结果：
 *   - 刷新后「未填」仍然是「未填」，不会被写成 0；
 *   - 口径或公式变了，重算一次就对，不会读到过期结果。
 * Storage 通过参数注入，测试里用假实现，不需要 jsdom。
 */

import { RETURN_PCT_DEFAULT, WITHDRAWAL_PCT_DEFAULT } from './kernel/constants'
import type { L1Form } from './kernel/parse'

export const STORAGE_KEY = 'new-money.l1.form.v1'

export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export const DEFAULT_FORM: L1Form = {
  assets: '',
  savings: '',
  expenses: '',
  returnPct: String(RETURN_PCT_DEFAULT),
  withdrawalPct: String(WITHDRAWAL_PCT_DEFAULT),
}

const FIELDS: ReadonlyArray<keyof L1Form> = ['assets', 'savings', 'expenses', 'returnPct', 'withdrawalPct']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 读不到、读坏了、字段类型不对，一律回落到默认值，不让页面白屏 */
export function loadForm(store: KeyValueStore): L1Form {
  let raw: string | null = null
  try {
    raw = store.getItem(STORAGE_KEY)
  } catch {
    return { ...DEFAULT_FORM }
  }
  if (raw === null) return { ...DEFAULT_FORM }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ...DEFAULT_FORM }
  }
  if (!isRecord(parsed)) return { ...DEFAULT_FORM }

  const form = { ...DEFAULT_FORM }
  for (const field of FIELDS) {
    const value = parsed[field]
    if (typeof value === 'string') form[field] = value
  }
  return form
}

/** 写失败（隐私模式、配额满）不影响当前会话，静默降级 */
export function saveForm(store: KeyValueStore, form: L1Form): boolean {
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(form))
    return true
  } catch {
    return false
  }
}

/** 空状态判定：三个主输入都还没填 */
export function isFormEmpty(form: L1Form): boolean {
  return form.assets.trim() === '' && form.savings.trim() === '' && form.expenses.trim() === ''
}

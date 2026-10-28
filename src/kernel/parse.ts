/**
 * 原始输入解析。
 *
 * 边界 6：未填与 0 必须可区分 —— 空字符串解析成 `null`（未填），
 * `"0"` 解析成 `0`（真的是 0）。这条靠类型和测试锁住，不靠 UI 约定。
 */

export type ParseError = 'not-a-number'

export interface ParsedField {
  /** 解析出的数值；null 表示「没填」 */
  value: number | null
  /** 非空但解析不出数字 */
  error: ParseError | null
}

/** 允许用户输入里出现的东西：千分位逗号、空格、百分号 */
function sanitize(raw: string): string {
  return raw.replace(/[,\s，%％]/g, '')
}

export function parseNumericInput(raw: string): ParsedField {
  const trimmed = raw.trim()
  if (trimmed === '') return { value: null, error: null }
  const clean = sanitize(trimmed)
  if (clean === '') return { value: null, error: 'not-a-number' }
  const value = Number(clean)
  if (!Number.isFinite(value)) return { value: null, error: 'not-a-number' }
  return { value, error: null }
}

/** 主表单 + 假设区的原始文本 */
export interface L1Form {
  /** 当前总资产 A（元） */
  assets: string
  /** 年新增储蓄 S（元） */
  savings: string
  /** 年生活开销 E（元） */
  expenses: string
  /** 预期年化收益率 r（%） */
  returnPct: string
  /** 提款率 w（%） */
  withdrawalPct: string
}

/** 解析后的输入；null = 未填 */
export interface L1Inputs {
  assets: number | null
  savings: number | null
  expenses: number | null
  returnPct: number | null
  withdrawalPct: number | null
}

export type L1Field = keyof L1Form

export type FieldErrors = Partial<Record<L1Field, string>>

/** 把表单文本解析成内核输入，同时给出逐字段的格式错误 */
export function parseForm(form: L1Form): { inputs: L1Inputs; errors: FieldErrors } {
  const fields: L1Field[] = ['assets', 'savings', 'expenses', 'returnPct', 'withdrawalPct']
  const inputs: L1Inputs = {
    assets: null,
    savings: null,
    expenses: null,
    returnPct: null,
    withdrawalPct: null,
  }
  const errors: FieldErrors = {}
  for (const field of fields) {
    const parsed = parseNumericInput(form[field])
    inputs[field] = parsed.value
    if (parsed.error === 'not-a-number') errors[field] = '请输入数字'
  }
  return { inputs, errors }
}

/**
 * 涨跌配色：A 股习惯红涨绿跌，海外习惯绿涨红跌。
 * 做成配置项而不是写死颜色 —— 只切换语义 token，具体色值仍在 tokens.css。
 */

export const COLOR_SCHEMES = ['red-up', 'green-up'] as const

export type ColorScheme = (typeof COLOR_SCHEMES)[number]

export const DEFAULT_COLOR_SCHEME: ColorScheme = 'red-up'

export const COLOR_SCHEME_LABELS: Record<ColorScheme, string> = {
  'red-up': '红涨绿跌',
  'green-up': '绿涨红跌',
}

export function isColorScheme(value: unknown): value is ColorScheme {
  return typeof value === 'string' && (COLOR_SCHEMES as readonly string[]).includes(value)
}

/** 切换色系 → 用于按钮的 data 属性与 CSS 变量作用域 */
export function colorSchemeAttribute(scheme: ColorScheme): 'red-up' | 'green-up' {
  return scheme
}

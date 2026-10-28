/**
 * 记账页的金额展示：精确到分，带 ¥。
 *
 * 为什么不用 kernel/format 的「万/亿」：单笔流水与当日小计要精确到元角分，
 * 「1.2万」看不出到底花了多少。首页的「资产总额」是资产口径，仍用万/亿（见 HomePage）。
 */

const plain = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** '¥1,234.50' / '-¥28.50' */
export function formatYuan(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const sign = value < 0 ? '-' : ''
  return `${sign}¥${plain.format(Math.abs(value))}`
}

/** 带符号：'+¥230.00' / '-¥230.00' / '¥0.00' */
export function formatSignedYuan(value: number): string {
  if (!Number.isFinite(value)) return '—'
  if (value === 0) return `${formatYuan(0)}`
  return value > 0 ? `+${formatYuan(value)}` : formatYuan(value)
}

/** 带符号百分比：'+0.03%' / '-0.02%'；null 表示分母无意义 */
export function formatSignedPct(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  const pct = value * 100
  if (pct === 0) return '0.00%'
  const sign = pct > 0 ? '+' : '-'
  return `${sign}${Math.abs(pct).toFixed(2)}%`
}

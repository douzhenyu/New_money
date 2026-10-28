/** 资产金额展示：¥ + 千分位 + 两位小数（配置结构与明细都要精确到分） */

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
  if (value === 0) return formatYuan(0)
  return value > 0 ? `+${formatYuan(value)}` : formatYuan(value)
}

/** 占比：0.625 → '62.5%'；0.5 → '50%'；0.004 → '<1%'；0 → '0%' */
export function formatShare(share: number): string {
  if (!Number.isFinite(share)) return '—'
  const pct = share * 100
  if (pct <= 0) return '0%'
  if (pct < 1) return '<1%'
  const rounded = Math.round(pct * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`
}

/** 带符号百分比：'+1.24%' / '-0.88%' / '0.00%' */
export function formatSignedPct(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  const pct = value * 100
  if (pct === 0) return '0.00%'
  const sign = pct > 0 ? '+' : '-'
  return `${sign}${Math.abs(pct).toFixed(2)}%`
}

/** 份额：最多 4 位小数，千分位（'1,000' / '12.3456'） */
export function formatUnits(units: number): string {
  if (!Number.isFinite(units)) return '—'
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 4 }).format(units)
}

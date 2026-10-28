/**
 * 数字展示口径。
 *
 * 边界 4：数值过大自动切换「万 / 亿」，且不允许出现 `1e+9` 这类科学计数法。
 * 用 Intl.NumberFormat 的 standard notation 而不是 toFixed，是因为
 * standard notation 不会对 ≥ 1e21 的值退化成 `1e+21`，toFixed 会。
 */

const WAN = 1e4
const YI = 1e8

const plain = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 })

/** 金额格式化：元 → 「1,234」「100万」「5.28亿」 */
export function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const abs = Math.abs(value)
  if (abs >= YI) return `${plain.format(value / YI)}亿`
  if (abs >= WAN) return `${plain.format(value / WAN)}万`
  return plain.format(value)
}

/**
 * 进度格式化：0..1 → 「0%」「<1%」「50%」「100%」。
 * 未达标时向下取整，避免 99.6% 显示成「100%」却同时写着未达成。
 */
export function formatProgress(progress: number): string {
  if (!Number.isFinite(progress)) return '—'
  const pct = progress * 100
  if (pct >= 100) return '100%'
  if (pct <= 0) return '0%'
  if (pct < 1) return '<1%'
  return `${Math.floor(pct)}%`
}

/** 百分比输入（10 → 「10%」），保留至多两位小数 */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return `${plain.format(value)}%`
}

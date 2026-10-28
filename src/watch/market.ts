/**
 * 大盘页的自选与指数 —— **L1 全部是静态假数据**。
 *
 * 数据只在 `market.json`，不接行情接口、不发网络请求。
 * 换真实数据源时只改这一层，页面与图表代码不动。
 */

import raw from './market.json'

export interface Quote {
  symbol: string
  /** 名称（主） */
  name: string
  /** 全称（次要灰字） */
  fullName: string
  price: number
  /** 涨跌额 */
  changeAmount: number
  /** 涨跌幅（%），正涨负跌 */
  changePct: number
  /** 迷你走势的历史点，从旧到新 */
  trend: number[]
}

export interface MarketIndex {
  symbol: string
  name: string
  /** 点位 */
  value: number
  changePct: number
  trend: number[]
}

interface MarketData {
  indices: MarketIndex[]
  quotes: Quote[]
}

const data = raw as MarketData

export const INDICES: readonly MarketIndex[] = data.indices
export const QUOTES: readonly Quote[] = data.quotes

export function quoteBySymbol(symbol: string): Quote | undefined {
  return QUOTES.find((quote) => quote.symbol === symbol)
}

/** 空状态里给的热门标的建议（挑前三个，模拟「建议」而不是随机） */
export const SUGGESTED_SYMBOLS: readonly string[] = QUOTES.slice(0, 3).map((quote) => quote.symbol)

/** 按自选顺序取，未知与重复自动跳过 */
export function quotesForSymbols(symbols: readonly string[]): Quote[] {
  const picked: Quote[] = []
  const seen = new Set<string>()
  for (const symbol of symbols) {
    if (seen.has(symbol)) continue
    const quote = quoteBySymbol(symbol)
    if (quote === undefined) continue
    seen.add(symbol)
    picked.push(quote)
  }
  return picked
}

export type Direction = 'up' | 'down' | 'flat'

export function directionOf(change: number): Direction {
  if (change > 0) return 'up'
  if (change < 0) return 'down'
  return 'flat'
}

/** 涨跌幅：'+1.24%' / '-0.88%' / '0.00%' */
export function formatChangePct(changePct: number): string {
  if (!Number.isFinite(changePct)) return '—'
  if (changePct === 0) return '0.00%'
  const sign = changePct > 0 ? '+' : '-'
  return `${sign}${Math.abs(changePct).toFixed(2)}%`
}

/** 涨跌额：'+20.60' / '-0.10' / '0.00' */
export function formatChangeAmount(changeAmount: number): string {
  if (!Number.isFinite(changeAmount)) return '—'
  if (changeAmount === 0) return '0.00'
  const sign = changeAmount > 0 ? '+' : '-'
  return `${sign}${Math.abs(changeAmount).toFixed(2)}`
}

/** 价格：至少两位小数，最多三位（ETF 净值常见 3 位），千分位 */
export function formatPrice(price: number): string {
  if (!Number.isFinite(price)) return '—'
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(price)
}

/** 指数点位：固定两位小数 */
export function formatIndexValue(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * 迷你走势的 SVG polyline 坐标（viewBox 0 0 width height）。
 * 点数不足 2 个返回空串（不画线，不报错）；全平价时画中线。
 */
export function sparklinePoints(
  trend: readonly number[],
  width: number,
  height: number,
  padding = 1,
): string {
  const valid = trend.filter((value) => Number.isFinite(value))
  if (valid.length < 2) return ''

  const min = Math.min(...valid)
  const max = Math.max(...valid)
  const innerWidth = width - padding * 2
  const innerHeight = height - padding * 2
  const stepX = innerWidth / (valid.length - 1)

  return valid
    .map((value, index) => {
      const x = padding + index * stepX
      const ratio = max === min ? 0.5 : (value - min) / (max - min)
      const y = padding + (1 - ratio) * innerHeight
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}

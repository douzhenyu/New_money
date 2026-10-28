/**
 * 自选标的的行情 —— **L1 全部是静态假数据**。
 *
 * 价格、涨跌幅、迷你走势都来自 `quotes.json`，不接任何行情接口、不发网络请求。
 * 换成真实行情时只需要在这里加一个数据源，页面与图表代码不动。
 */

import raw from './quotes.json'

export interface Quote {
  symbol: string
  name: string
  /** 最新价 */
  price: number
  /** 涨跌幅（%），正涨负跌 */
  changePct: number
  /** 迷你走势的历史点，从旧到新 */
  trend: number[]
}

/** 示例标的池（静态假数据） */
export const QUOTES: readonly Quote[] = raw

export function quoteBySymbol(symbol: string): Quote | undefined {
  return QUOTES.find((quote) => quote.symbol === symbol)
}

/** 按 symbol 顺序取，缺的自动跳过（存储里有脏数据也不会崩） */
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

export function directionOf(changePct: number): Direction {
  if (changePct > 0) return 'up'
  if (changePct < 0) return 'down'
  return 'flat'
}

/** 涨跌幅文案：带符号，两位小数，0 不带符号 */
export function formatChangePct(changePct: number): string {
  if (!Number.isFinite(changePct)) return '—'
  if (changePct === 0) return '0.00%'
  const sign = changePct > 0 ? '+' : '-'
  return `${sign}${Math.abs(changePct).toFixed(2)}%`
}

/** 价格文案：最多 3 位小数，去尾零（ETF 净值常见 3 位） */
export function formatPrice(price: number): string {
  if (!Number.isFinite(price)) return '—'
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(price)
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
  if (trend.length < 2) return ''
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

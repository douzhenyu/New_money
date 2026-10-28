import { describe, expect, it } from 'vitest'
import {
  directionOf,
  formatChangePct,
  formatPrice,
  QUOTES,
  quoteBySymbol,
  quotesForSymbols,
  sparklinePoints,
} from './quotes'
import { COLOR_SCHEMES, DEFAULT_COLOR_SCHEME, isColorScheme } from './settings'

describe('静态假数据（不接行情接口）', () => {
  it('标的是唯一的一批，字段齐全', () => {
    expect(QUOTES.length).toBeGreaterThanOrEqual(5)
    const symbols = QUOTES.map((quote) => quote.symbol)
    expect(new Set(symbols).size).toBe(symbols.length)
    for (const quote of QUOTES) {
      expect(quote.name.length).toBeGreaterThan(0)
      expect(Number.isFinite(quote.price)).toBe(true)
      expect(Number.isFinite(quote.changePct)).toBe(true)
      expect(quote.trend.length).toBeGreaterThanOrEqual(2)
      expect(quote.trend.every((point) => Number.isFinite(point))).toBe(true)
    }
  })

  it('包含涨、跌、平三种情况（便于验收配色）', () => {
    const directions = new Set(QUOTES.map((quote) => directionOf(quote.changePct)))
    expect(directions.has('up')).toBe(true)
    expect(directions.has('down')).toBe(true)
    expect(directions.has('flat')).toBe(true)
  })

  it('按 symbol 取标的，未知返回 undefined', () => {
    expect(quoteBySymbol(QUOTES[0]!.symbol)?.name).toBe(QUOTES[0]!.name)
    expect(quoteBySymbol('NOPE')).toBeUndefined()
  })

  it('按自选顺序取，跳过未知与重复', () => {
    const first = QUOTES[1]!.symbol
    const second = QUOTES[0]!.symbol
    const picked = quotesForSymbols([second, 'NOPE', first, second])
    expect(picked.map((quote) => quote.symbol)).toEqual([second, first])
  })
})

describe('涨跌展示', () => {
  it('涨跌平三种方向', () => {
    expect(directionOf(1.2)).toBe('up')
    expect(directionOf(-1.2)).toBe('down')
    expect(directionOf(0)).toBe('flat')
  })

  it('涨跌幅带符号、两位小数', () => {
    expect(formatChangePct(1.24)).toBe('+1.24%')
    expect(formatChangePct(-0.88)).toBe('-0.88%')
    expect(formatChangePct(0)).toBe('0.00%')
    expect(formatChangePct(Number.NaN)).toBe('—')
  })

  it('价格至少两位小数，最多三位', () => {
    expect(formatPrice(1685.5)).toBe('1,685.50')
    expect(formatPrice(3.982)).toBe('3.982')
    expect(formatPrice(Number.NaN)).toBe('—')
  })
})

describe('迷你走势坐标', () => {
  it('点数不足两个就不画', () => {
    expect(sparklinePoints([], 60, 20)).toBe('')
    expect(sparklinePoints([1], 60, 20)).toBe('')
    expect(sparklinePoints([1, Number.NaN], 60, 20)).toBe('')
  })

  it('点数与输入一致，且都在画布内', () => {
    const points = sparklinePoints([1, 2, 3, 4], 60, 20, 1)
    const pairs = points.split(' ').map((pair) => pair.split(',').map(Number))
    expect(pairs).toHaveLength(4)
    for (const [x, y] of pairs) {
      expect(x).toBeGreaterThanOrEqual(1)
      expect(x).toBeLessThanOrEqual(59)
      expect(y).toBeGreaterThanOrEqual(1)
      expect(y).toBeLessThanOrEqual(19)
    }
  })

  it('最高点在上、最低点在下（y 轴翻转）', () => {
    const points = sparklinePoints([10, 20], 60, 20, 1)
    const pairs = points.split(' ').map((pair) => pair.split(',').map(Number))
    const firstY = pairs[0]?.[1] ?? Number.NaN
    const secondY = pairs[1]?.[1] ?? Number.NaN
    expect(firstY).toBeGreaterThan(secondY)
  })

  it('全平价画中线，不出 NaN', () => {
    const points = sparklinePoints([5, 5, 5], 60, 20, 1)
    expect(points).not.toContain('NaN')
    expect(points.split(' ')).toHaveLength(3)
  })
})

describe('涨跌配色配置', () => {
  it('默认红涨绿跌（A 股习惯）', () => {
    expect(DEFAULT_COLOR_SCHEME).toBe('red-up')
    expect(COLOR_SCHEMES).toContain('red-up')
  })

  it('只接受两种合法值', () => {
    expect(isColorScheme('red-up')).toBe(true)
    expect(isColorScheme('green-up')).toBe(true)
    expect(isColorScheme('blue-up')).toBe(false)
    expect(isColorScheme(null)).toBe(false)
  })
})

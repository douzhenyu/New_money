import { describe, expect, it } from 'vitest'
import {
  directionOf,
  formatChangeAmount,
  formatChangePct,
  formatIndexValue,
  formatPrice,
  INDICES,
  quoteBySymbol,
  QUOTES,
  quotesForSymbols,
  sparklinePoints,
  SUGGESTED_SYMBOLS,
} from './market'
import { COLOR_SCHEMES, DEFAULT_COLOR_SCHEME, isColorScheme } from './settings'

describe('静态假数据（不接行情接口）', () => {
  it('指数是三张卡片，字段齐全', () => {
    expect(INDICES).toHaveLength(3)
    for (const index of INDICES) {
      expect(index.name.length).toBeGreaterThan(0)
      expect(Number.isFinite(index.value)).toBe(true)
      expect(Number.isFinite(index.changePct)).toBe(true)
      expect(index.trend.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('自选池字段齐全且 symbol 唯一', () => {
    expect(QUOTES.length).toBeGreaterThanOrEqual(5)
    const symbols = QUOTES.map((quote) => quote.symbol)
    expect(new Set(symbols).size).toBe(symbols.length)
    for (const quote of QUOTES) {
      expect(quote.name.length).toBeGreaterThan(0)
      expect(quote.fullName.length).toBeGreaterThan(0)
      expect(Number.isFinite(quote.price)).toBe(true)
      expect(Number.isFinite(quote.changeAmount)).toBe(true)
      expect(quote.trend.length).toBeGreaterThanOrEqual(2)
      expect(quote.trend.every((point) => Number.isFinite(point))).toBe(true)
    }
  })

  it('价格、涨跌额、涨跌幅三者自洽', () => {
    for (const quote of QUOTES) {
      const previousClose = quote.price - quote.changeAmount
      if (previousClose === 0) continue
      expect((quote.changeAmount / previousClose) * 100).toBeCloseTo(quote.changePct, 1)
      expect(directionOf(quote.changeAmount)).toBe(directionOf(quote.changePct))
    }
  })

  it('包含涨、跌、平三种情况（便于验收配色）', () => {
    const directions = new Set(QUOTES.map((quote) => directionOf(quote.changePct)))
    expect(directions.has('up')).toBe(true)
    expect(directions.has('down')).toBe(true)
    expect(directions.has('flat')).toBe(true)
  })

  it('空状态建议取前三个真实存在的标的', () => {
    expect(SUGGESTED_SYMBOLS).toHaveLength(3)
    for (const symbol of SUGGESTED_SYMBOLS) {
      expect(quoteBySymbol(symbol)).toBeDefined()
    }
  })

  it('按自选顺序取，未知与重复自动跳过', () => {
    const first = QUOTES[1]!.symbol
    const second = QUOTES[0]!.symbol
    expect(quotesForSymbols([second, 'NOPE', first, second]).map((quote) => quote.symbol)).toEqual([
      second,
      first,
    ])
  })
})

describe('数字展示', () => {
  it('涨跌幅带符号两位小数', () => {
    expect(formatChangePct(1.24)).toBe('+1.24%')
    expect(formatChangePct(-0.88)).toBe('-0.88%')
    expect(formatChangePct(0)).toBe('0.00%')
    expect(formatChangePct(Number.NaN)).toBe('—')
  })

  it('涨跌额带符号两位小数', () => {
    expect(formatChangeAmount(20.646)).toBe('+20.65')
    expect(formatChangeAmount(-0.099)).toBe('-0.10')
    expect(formatChangeAmount(0)).toBe('0.00')
  })

  it('价格千分位、两到三位小数', () => {
    expect(formatPrice(1685.646)).toBe('1,685.646')
    expect(formatPrice(11.181)).toBe('11.181')
    expect(formatPrice(Number.NaN)).toBe('—')
  })

  it('指数点位固定两位小数', () => {
    expect(formatIndexValue(3245.68)).toBe('3,245.68')
    expect(formatIndexValue(10236.5)).toBe('10,236.50')
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

  it('最高点在上（y 轴翻转）', () => {
    const pairs = sparklinePoints([10, 20], 60, 20, 1)
      .split(' ')
      .map((pair) => pair.split(',').map(Number))
    expect(pairs[0]?.[1] ?? Number.NaN).toBeGreaterThan(pairs[1]?.[1] ?? Number.NaN)
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
    expect(COLOR_SCHEMES).toEqual(['red-up', 'green-up'])
  })

  it('只接受两种合法值', () => {
    expect(isColorScheme('red-up')).toBe(true)
    expect(isColorScheme('green-up')).toBe(true)
    expect(isColorScheme('blue-up')).toBe(false)
    expect(isColorScheme(null)).toBe(false)
  })
})

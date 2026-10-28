import { describe, expect, it } from 'vitest'
import { formatMoney, formatPercent, formatProgress } from './format'

describe('边界 4：自动切换万 / 亿，不出现科学计数法', () => {
  it('一万以下保持原样带千分位', () => {
    expect(formatMoney(0)).toBe('0')
    expect(formatMoney(1234)).toBe('1,234')
    expect(formatMoney(9999)).toBe('9,999')
  })

  it('一万到一亿用「万」', () => {
    expect(formatMoney(1e4)).toBe('1万')
    expect(formatMoney(100 * 1e4)).toBe('100万')
    expect(formatMoney(200 * 1e4)).toBe('200万')
    expect(formatMoney(500 * 1e4)).toBe('500万')
    expect(formatMoney(123.4567 * 1e4)).toBe('123.46万')
  })

  it('一亿以上用「亿」', () => {
    expect(formatMoney(1e8)).toBe('1亿')
    expect(formatMoney(1e9)).toBe('10亿')
    expect(formatMoney(1.2345e10)).toBe('123.45亿')
  })

  it('任何量级都不出现 1e+9 这种输出', () => {
    for (const value of [1e9, 1e12, 1e15, 1e18, 1e21, 1e24]) {
      const text = formatMoney(value)
      expect(text).not.toMatch(/e\+/i)
    }
  })

  it('负数金额也按量级格式化', () => {
    expect(formatMoney(-12 * 1e4)).toBe('-12万')
  })

  it('非有限数不崩，显示占位符', () => {
    expect(formatMoney(Number.NaN)).toBe('—')
    expect(formatMoney(Number.POSITIVE_INFINITY)).toBe('—')
  })
})

describe('进度百分比', () => {
  it('测试向量里的三个值', () => {
    expect(formatProgress(1)).toBe('100%')
    expect(formatProgress(0.5)).toBe('50%')
    expect(formatProgress(0.2)).toBe('20%')
  })

  it('未达标不显示 100%', () => {
    expect(formatProgress(0.996)).toBe('99%')
  })

  it('极小的进度显示 <1%', () => {
    expect(formatProgress(0.004)).toBe('<1%')
    expect(formatProgress(0)).toBe('0%')
  })
})

describe('百分比输入回显', () => {
  it('整数与小数都不带多余零', () => {
    expect(formatPercent(10)).toBe('10%')
    expect(formatPercent(2.5)).toBe('2.5%')
    expect(formatPercent(4)).toBe('4%')
  })
})

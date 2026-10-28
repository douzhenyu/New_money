import { describe, expect, it } from 'vitest'
import { formatShare, formatSignedPct, formatSignedYuan, formatUnits, formatYuan } from './format'

describe('金额展示', () => {
  it('千分位 + 两位小数 + ¥', () => {
    expect(formatYuan(0)).toBe('¥0.00')
    expect(formatYuan(346856.5)).toBe('¥346,856.50')
    expect(formatYuan(28)).toBe('¥28.00')
  })

  it('负数把负号放在 ¥ 前面', () => {
    expect(formatYuan(-1200)).toBe('-¥1,200.00')
  })

  it('非有限数是占位符', () => {
    expect(formatYuan(Number.NaN)).toBe('—')
  })

  it('带符号金额：0 不加符号', () => {
    expect(formatSignedYuan(6856.5)).toBe('+¥6,856.50')
    expect(formatSignedYuan(-6856.5)).toBe('-¥6,856.50')
    expect(formatSignedYuan(0)).toBe('¥0.00')
  })
})

describe('占比展示', () => {
  it('一位小数，整数不补 .0', () => {
    expect(formatShare(1)).toBe('100%')
    expect(formatShare(0.5)).toBe('50%')
    expect(formatShare(0.625)).toBe('62.5%')
  })

  it('小于 1% 显示 <1%，0 显示 0%', () => {
    expect(formatShare(0.004)).toBe('<1%')
    expect(formatShare(0)).toBe('0%')
  })
})

describe('浮动百分比', () => {
  it('带符号、两位小数', () => {
    expect(formatSignedPct(0.0201)).toBe('+2.01%')
    expect(formatSignedPct(-0.0088)).toBe('-0.88%')
    expect(formatSignedPct(0)).toBe('0.00%')
  })

  it('null（没有成本）显示占位符而不是 NaN', () => {
    expect(formatSignedPct(null)).toBe('—')
  })
})

describe('份额展示', () => {
  it('千分位，最多 4 位小数', () => {
    expect(formatUnits(1000)).toBe('1,000')
    expect(formatUnits(12.3456)).toBe('12.3456')
  })
})

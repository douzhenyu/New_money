import { describe, expect, it } from 'vitest'
import { formatSignedPct, formatSignedYuan, formatYuan } from './format'

describe('金额展示（记账页精确到分）', () => {
  it('千分位 + 两位小数 + ¥', () => {
    expect(formatYuan(28.5)).toBe('¥28.50')
    expect(formatYuan(1234.5)).toBe('¥1,234.50')
    expect(formatYuan(0)).toBe('¥0.00')
  })

  it('负数把负号放在 ¥ 前面', () => {
    expect(formatYuan(-230)).toBe('-¥230.00')
  })

  it('非有限数是占位符，不出现 NaN', () => {
    expect(formatYuan(Number.NaN)).toBe('—')
  })

  it('带符号金额：0 不加符号', () => {
    expect(formatSignedYuan(-230)).toBe('-¥230.00')
    expect(formatSignedYuan(230)).toBe('+¥230.00')
    expect(formatSignedYuan(0)).toBe('¥0.00')
  })

  it('带符号百分比', () => {
    expect(formatSignedPct(-0.0002)).toBe('-0.02%')
    expect(formatSignedPct(0.0003)).toBe('+0.03%')
    expect(formatSignedPct(0)).toBe('0.00%')
    expect(formatSignedPct(null)).toBe('—')
  })
})

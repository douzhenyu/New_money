import { describe, expect, it } from 'vitest'
import { isValidISODate, monthOf, toISODate } from './dates'

describe('日期口径用本地日历日', () => {
  it('toISODate 用本地时区，不受 UTC 影响', () => {
    // 2026-10-28 00:30（本地）在 UTC 里还是前一天，必须仍然算 28 日
    expect(toISODate(new Date(2026, 9, 28, 0, 30))).toBe('2026-10-28')
    expect(toISODate(new Date(2026, 9, 28, 23, 59))).toBe('2026-10-28')
    expect(toISODate(new Date(2026, 0, 1))).toBe('2026-01-01')
  })

  it('月份补零', () => {
    expect(toISODate(new Date(2026, 2, 5))).toBe('2026-03-05')
  })

  it('只接受真实存在的日历日', () => {
    expect(isValidISODate('2026-10-28')).toBe(true)
    expect(isValidISODate('2026-02-29')).toBe(false) // 2026 不是闰年
    expect(isValidISODate('2024-02-29')).toBe(true)
    expect(isValidISODate('2026-13-01')).toBe(false)
    expect(isValidISODate('2026-10-32')).toBe(false)
    expect(isValidISODate('2026-1-1')).toBe(false)
    expect(isValidISODate('')).toBe(false)
  })

  it('monthOf 取年月', () => {
    expect(monthOf('2026-10-28')).toBe('2026-10')
  })
})

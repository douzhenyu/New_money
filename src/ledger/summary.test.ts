import { describe, expect, it } from 'vitest'
import {
  computeAssetOverview,
  entriesInMonth,
  groupByDay,
  sortEntriesDesc,
  sumAmount,
} from './summary'
import type { LedgerEntry } from './entries'

const TODAY = '2026-10-28'

function entry(overrides: Partial<LedgerEntry> & Pick<LedgerEntry, 'id'>): LedgerEntry {
  return {
    amount: 100,
    category: 'food',
    date: TODAY,
    note: '',
    createdAt: 1,
    ...overrides,
  }
}

/** 三天数据：今天两笔、昨天一笔、上个月一笔 */
const ENTRIES: LedgerEntry[] = [
  entry({ id: 'today-food', amount: 200, date: TODAY, createdAt: 2 }),
  entry({ id: 'today-cab', amount: 30, date: TODAY, createdAt: 3, category: 'transport' }),
  entry({ id: 'yesterday-rent', amount: 500, date: '2026-10-27', createdAt: 1, category: 'housing' }),
  entry({ id: 'lastmonth', amount: 999, date: '2026-09-30', createdAt: 4 }),
]

describe('日期倒序 + 同日按创建时间倒序', () => {
  it('新记的在最上面', () => {
    expect(sortEntriesDesc(ENTRIES).map((item) => item.id)).toEqual([
      'today-cab',
      'today-food',
      'yesterday-rent',
      'lastmonth',
    ])
  })

  it('不改动入参数组', () => {
    const snapshot = ENTRIES.map((item) => item.id)
    sortEntriesDesc(ENTRIES)
    expect(ENTRIES.map((item) => item.id)).toEqual(snapshot)
  })

  it('求和', () => {
    expect(sumAmount(ENTRIES)).toBe(1729)
    expect(sumAmount([])).toBe(0)
  })
})

describe('本月流水', () => {
  it('只留本月，其他月份不出现', () => {
    expect(entriesInMonth(ENTRIES, TODAY).map((item) => item.id)).toEqual([
      'today-cab',
      'today-food',
      'yesterday-rent',
    ])
  })

  it('按月分组，每组给出当日小计', () => {
    const groups = groupByDay(entriesInMonth(ENTRIES, TODAY))
    expect(groups.map((group) => group.date)).toEqual(['2026-10-28', '2026-10-27'])
    expect(groups[0]?.subtotal).toBe(230)
    expect(groups[0]?.dayOfMonth).toBe(28)
    expect(groups[0]?.entries.map((item) => item.id)).toEqual(['today-cab', 'today-food'])
    expect(groups[1]?.subtotal).toBe(500)
  })

  it('空列表没有分组', () => {
    expect(groupByDay([])).toEqual([])
  })
})

describe('首页资产概览', () => {
  it('资产总额 = 测算页当前总资产 − 累计支出', () => {
    const overview = computeAssetOverview({ planAssets: 1_500_000, entries: ENTRIES, today: TODAY })
    expect(overview.assets).toBe(1_500_000 - 1729)
    expect(overview.spentAllTime).toBe(1729)
    expect(overview.spentThisMonth).toBe(730)
    expect(overview.spentToday).toBe(230)
  })

  it('今日变动是负数（支出），百分比相对今日开始时的资产', () => {
    const overview = computeAssetOverview({ planAssets: 1_500_000, entries: ENTRIES, today: TODAY })
    expect(overview.todayChange).toBe(-230)
    const openingAssets = 1_500_000 - 1729 + 230
    expect(overview.todayChangePct).toBeCloseTo(-230 / openingAssets, 12)
  })

  it('测算页没填当前总资产时资产总额未知，百分比也不给', () => {
    const overview = computeAssetOverview({ planAssets: null, entries: ENTRIES, today: TODAY })
    expect(overview.assets).toBeNull()
    expect(overview.todayChangePct).toBeNull()
    // 金额照常显示，不能被「未填」吞掉
    expect(overview.todayChange).toBe(-230)
    expect(overview.spentToday).toBe(230)
  })

  it('今日开始时资产 ≤ 0 时百分比无意义，给 null 而不是负百分比', () => {
    const overview = computeAssetOverview({ planAssets: 230, entries: ENTRIES, today: TODAY })
    expect(overview.assets).toBe(230 - 1729)
    expect(overview.todayChangePct).toBeNull()
  })

  it('没有任何记录时是 0，不是空白', () => {
    const overview = computeAssetOverview({ planAssets: 1000, entries: [], today: TODAY })
    expect(overview).toMatchObject({
      assets: 1000,
      todayChange: 0,
      todayChangePct: 0,
      spentAllTime: 0,
      spentThisMonth: 0,
      spentToday: 0,
      month: '2026-10',
    })
  })

  it('今天的日期由参数决定，不读系统时钟', () => {
    const overview = computeAssetOverview({ planAssets: 0, entries: ENTRIES, today: '2026-10-27' })
    expect(overview.spentToday).toBe(500)
    expect(overview.spentThisMonth).toBe(730)
    expect(overview.month).toBe('2026-10')
  })
})

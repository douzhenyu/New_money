import { describe, expect, it } from 'vitest'
import { groupByCategory, summarize } from './summary'
import type { AssetItem } from './holdings'

function item(overrides: Partial<AssetItem> & Pick<AssetItem, 'id' | 'category'>): AssetItem {
  return {
    name: overrides.id,
    amount: 1000,
    units: null,
    price: null,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

const ITEMS: AssetItem[] = [
  item({ id: 'cash-1', category: 'cash', amount: 50000 }),
  item({ id: 'cash-2', category: 'cash', amount: 30000, name: '现金钱包' }),
  item({ id: 'dep-1', category: 'deposit', amount: 200000 }),
  item({ id: 'stock-1', category: 'stock', amount: 10000, units: 10, price: 1685.65, name: '贵州茅台' }),
  item({ id: 'fund-1', category: 'fund', amount: 50000 }),
]

describe('总资产与浮动', () => {
  it('总资产 = Σ 市值（股票/基金按份额×现价）', () => {
    const summary = summarize(ITEMS)
    // 50000 + 30000 + 200000 + 16856.5 + 50000
    expect(summary.total).toBeCloseTo(346856.5, 6)
  })

  it('成本是各条「金额」之和，浮动 = 总资产 − 成本', () => {
    const summary = summarize(ITEMS)
    expect(summary.cost).toBe(340000)
    expect(summary.floating).toBeCloseTo(6856.5, 6)
    expect(summary.floatingPct).toBeCloseTo(6856.5 / 340000, 12)
  })

  it('没有份额/现价时浮动为 0，不是 NaN', () => {
    const summary = summarize([item({ id: 'a', category: 'cash', amount: 1000 })])
    expect(summary.total).toBe(1000)
    expect(summary.floating).toBe(0)
    expect(summary.floatingPct).toBe(0)
  })

  it('空列表：总资产 0、没有分组、百分比 null（不是 NaN）', () => {
    const summary = summarize([])
    expect(summary.total).toBe(0)
    expect(summary.cost).toBe(0)
    expect(summary.floating).toBe(0)
    expect(summary.floatingPct).toBeNull()
    expect(summary.groups).toEqual([])
  })
})

describe('配置结构', () => {
  it('只含有条目的类别，金额降序', () => {
    const summary = summarize(ITEMS)
    expect(summary.groups.map((group) => group.label)).toEqual(['存款', '现金', '基金', '股票'])
    expect(summary.groups.map((group) => group.count)).toEqual([1, 2, 1, 1])
  })

  it('占比之和为 1，且每类 = 该类金额 ÷ 总资产', () => {
    const summary = summarize(ITEMS)
    const shareSum = summary.groups.reduce((sum, group) => sum + group.share, 0)
    expect(shareSum).toBeCloseTo(1, 12)
    const deposit = summary.groups.find((group) => group.category === 'deposit')
    expect(deposit?.share).toBeCloseTo(200000 / 346856.5, 12)
  })

  it('同类多条合并成一类，金额累加', () => {
    const groups = groupByCategory(ITEMS)
    const cash = groups.find((group) => group.category === 'cash')
    expect(cash?.amount).toBe(80000)
    expect(cash?.items.map((entry) => entry.id)).toEqual(['cash-1', 'cash-2'])
  })

  it('删掉某类最后一条 → 该类从配置结构消失，不留 0', () => {
    const withoutFund = ITEMS.filter((entry) => entry.category !== 'fund')
    const groups = summarize(withoutFund).groups
    expect(groups.some((group) => group.category === 'fund')).toBe(false)
    expect(groups.every((group) => group.amount > 0)).toBe(true)
  })

  it('只有一个类别时占比 100%', () => {
    const summary = summarize([item({ id: 'a', category: 'bond', amount: 3000 })])
    expect(summary.groups).toHaveLength(1)
    expect(summary.groups[0]?.share).toBe(1)
  })

  it('明细行按市值降序', () => {
    const summary = summarize([
      item({ id: 'small', category: 'cash', amount: 100 }),
      item({ id: 'big', category: 'cash', amount: 9000 }),
    ])
    expect(summary.groups[0]?.items.map((entry) => entry.id)).toEqual(['big', 'small'])
  })
})

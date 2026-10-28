import { describe, expect, it } from 'vitest'
import { computeL1, estimateYears, formatYears, MESSAGES, validateInputs } from './lighthouse'
import type { ComputedLighthouse, L1Result } from './lighthouse'
import type { L1Inputs } from './parse'

const WAN = 1e4

/** 父 issue 测试向量的输入：A = 100 万、S = 10 万、E = 20 万、r = 10%、w = 4% */
const VECTOR: L1Inputs = {
  assets: 100 * WAN,
  savings: 10 * WAN,
  expenses: 20 * WAN,
  returnPct: 10,
  withdrawalPct: 4,
}

function computed(result: L1Result, index: 0 | 1 | 2): ComputedLighthouse {
  const item = result.lighthouses[index]
  if (item.state !== 'computed') {
    throw new Error(`灯塔${index + 1} 未计算：${item.message}`)
  }
  return item
}

describe('测试向量（OPHE-29）', () => {
  const result = computeL1(VECTOR)

  it('灯塔一：目标 100 万，已达成 100%，0 年', () => {
    const first = computed(result, 0)
    expect(first.target).toBe(100 * WAN)
    expect(first.progress).toBe(1)
    expect(first.achieved).toBe(true)
    expect(first.years).toEqual({ kind: 'reached', years: 0 })
    expect(formatYears(first.years)).toBe(MESSAGES.achieved)
  })

  it('灯塔二：目标 200 万，进度 50%，5 年', () => {
    const second = computed(result, 1)
    expect(second.target).toBe(200 * WAN)
    expect(second.progress).toBeCloseTo(0.5, 10)
    expect(second.achieved).toBe(false)
    expect(second.years).toEqual({ kind: 'reached', years: 5 })
  })

  it('灯塔三：目标 500 万，进度 20%，12 年', () => {
    const third = computed(result, 2)
    expect(third.target).toBe(500 * WAN)
    expect(third.progress).toBeCloseTo(0.2, 10)
    expect(third.achieved).toBe(false)
    expect(third.years).toEqual({ kind: 'reached', years: 12 })
  })

  it('公式就是 A₁ = S/r、A₂ = E/r、A₃ = E/w', () => {
    expect(computed(result, 0).target).toBe(VECTOR.savings! / (VECTOR.returnPct! / 100))
    expect(computed(result, 1).target).toBe(VECTOR.expenses! / (VECTOR.returnPct! / 100))
    expect(computed(result, 2).target).toBe(VECTOR.expenses! / (VECTOR.withdrawalPct! / 100))
  })

  it('顶部结论：最近达成灯塔一，距灯塔二还差 100 万', () => {
    expect(result.summary.kind).toBe('distance')
    expect(result.summary.nearest).toMatchObject({ index: 1, achieved: true, target: 100 * WAN })
    expect(result.summary.next).toMatchObject({ index: 2, gap: 100 * WAN })
  })
})

describe('边界 1：r = 0 → 不计算，提示「收益率需大于 0」', () => {
  const result = computeL1({ ...VECTOR, returnPct: 0 })

  it('三个灯塔全部未计算', () => {
    for (const item of result.lighthouses) {
      expect(item.state).toBe('unavailable')
    }
  })

  it('文案是产品口径的那一句', () => {
    for (const item of result.lighthouses) {
      if (item.state !== 'unavailable') throw new Error('应当未计算')
      expect(item.reason).toBe('return-invalid')
      expect(item.message).toBe('收益率需大于 0')
    }
  })

  it('字段级提示也是同一句（不另写同义文案）', () => {
    expect(validateInputs({ ...VECTOR, returnPct: 0 }).returnPct).toBe('收益率需大于 0')
  })

  it('收益率超上限 30% 也只提示不计算', () => {
    const tooHigh = computeL1({ ...VECTOR, returnPct: 31 })
    expect(tooHigh.lighthouses.every((item) => item.state === 'unavailable')).toBe(true)
    const first = tooHigh.lighthouses[0]!
    if (first.state !== 'unavailable') throw new Error('应当未计算')
    expect(first.message).toBe(MESSAGES.returnTooHigh)
  })
})

describe('边界 2：E = 0 → 灯塔二、三显示「未填开销」，灯塔一照常', () => {
  const result = computeL1({ ...VECTOR, expenses: 0 })

  it('灯塔一仍计算', () => {
    expect(computed(result, 0).target).toBe(100 * WAN)
  })

  it('灯塔二、三未计算且文案是「未填开销」', () => {
    for (const index of [1, 2] as const) {
      const item = result.lighthouses[index]
      if (item.state !== 'unavailable') throw new Error('应当未计算')
      expect(item.reason).toBe('expenses-missing')
      expect(item.message).toBe('未填开销')
    }
  })
})

describe('边界 3：A = 0 → 进度 0，年数照常算', () => {
  const result = computeL1({ ...VECTOR, assets: 0 })

  it('三个灯塔进度都是 0', () => {
    expect(computed(result, 0).progress).toBe(0)
    expect(computed(result, 1).progress).toBe(0)
    expect(computed(result, 2).progress).toBe(0)
  })

  it('年数照常算：8 / 12 / 19 年', () => {
    expect(computed(result, 0).years).toEqual({ kind: 'reached', years: 8 })
    expect(computed(result, 1).years).toEqual({ kind: 'reached', years: 12 })
    expect(computed(result, 2).years).toEqual({ kind: 'reached', years: 19 })
  })
})

describe('边界 5：任一输入为空 → 该灯塔未计算', () => {
  it('A 未填 → 三个灯塔都未计算', () => {
    const result = computeL1({ ...VECTOR, assets: null })
    for (const item of result.lighthouses) {
      expect(item.state).toBe('unavailable')
      if (item.state === 'unavailable') expect(item.message).toBe(MESSAGES.assetsMissing)
    }
  })

  it('S 未填 → 三个灯塔都未计算（年数也依赖 S）', () => {
    const result = computeL1({ ...VECTOR, savings: null })
    for (const item of result.lighthouses) {
      expect(item.state).toBe('unavailable')
      if (item.state === 'unavailable') expect(item.message).toBe(MESSAGES.savingsMissing)
    }
  })

  it('E 未填 → 只有灯塔二、三未计算', () => {
    const result = computeL1({ ...VECTOR, expenses: null })
    expect(result.lighthouses[0]!.state).toBe('computed')
    for (const index of [1, 2] as const) {
      const item = result.lighthouses[index]!
      if (item.state !== 'unavailable') throw new Error('应当未计算')
      expect(item.message).toBe('未填开销')
    }
  })

  it('R 未填 → 三个灯塔都未计算，文案是「未填收益率」', () => {
    const result = computeL1({ ...VECTOR, returnPct: null })
    for (const item of result.lighthouses) {
      if (item.state !== 'unavailable') throw new Error('应当未计算')
      expect(item.message).toBe(MESSAGES.returnMissing)
    }
  })

  it('W 未填 → 只有灯塔三未计算', () => {
    const result = computeL1({ ...VECTOR, withdrawalPct: null })
    expect(result.lighthouses[0]!.state).toBe('computed')
    expect(result.lighthouses[1]!.state).toBe('computed')
    const third = result.lighthouses[2]!
    if (third.state !== 'unavailable') throw new Error('应当未计算')
    expect(third.message).toBe(MESSAGES.withdrawalMissing)
  })

  it('全部未填 → incomplete，不出结论', () => {
    const result = computeL1({
      assets: null,
      savings: null,
      expenses: null,
      returnPct: null,
      withdrawalPct: null,
    })
    expect(result.summary.kind).toBe('incomplete')
    expect(result.summary.next).toBeNull()
  })
})

describe('边界 6：未填与 0 必须可区分', () => {
  it('S = 0 与 S 未填 是两种状态', () => {
    const zero = computeL1({ ...VECTOR, savings: 0 }).lighthouses[0]!
    const missing = computeL1({ ...VECTOR, savings: null }).lighthouses[0]!
    expect(zero.state).toBe('unavailable')
    expect(missing.state).toBe('unavailable')
    if (zero.state !== 'unavailable' || missing.state !== 'unavailable') throw new Error()
    expect(zero.reason).toBe('savings-not-positive')
    expect(missing.reason).toBe('savings-missing')
    expect(zero.message).not.toBe(missing.message)
  })

  it('A = 0 会计算，A 未填 不计算', () => {
    expect(computeL1({ ...VECTOR, assets: 0 }).lighthouses[0]!.state).toBe('computed')
    expect(computeL1({ ...VECTOR, assets: null }).lighthouses[0]!.state).toBe('unavailable')
  })
})

describe('年数规则', () => {
  it('S ≤ 0 且未达标 → 「按当前储蓄无法到达」', () => {
    const result = computeL1({ ...VECTOR, savings: -1 * WAN })
    const second = computed(result, 1)
    expect(second.years).toEqual({ kind: 'unreachable' })
    expect(formatYears(second.years)).toBe('按当前储蓄无法到达')
  })

  it('S ≤ 0 但已达标 → 已达成 0 年', () => {
    const result = computeL1({ ...VECTOR, assets: 600 * WAN, savings: -1 * WAN })
    expect(computed(result, 1).years).toEqual({ kind: 'reached', years: 0 })
    expect(formatYears(computed(result, 2).years)).toBe(MESSAGES.achieved)
  })

  it('S ≤ 0 时灯塔一的目标资产不是正数，按「不适用」处理（口径见 CONTEXT.md）', () => {
    const first = computeL1({ ...VECTOR, savings: -1 * WAN }).lighthouses[0]!
    if (first.state !== 'unavailable') throw new Error('应当未计算')
    expect(first.reason).toBe('savings-not-positive')
    expect(first.message).toBe(MESSAGES.savingsNotPositive)
  })

  it('60 年内到不了 → 「60 年以上」', () => {
    const result = computeL1({
      assets: 0,
      savings: 100,
      expenses: 400 * WAN,
      returnPct: 1,
      withdrawalPct: 4,
    })
    expect(computed(result, 2).years).toEqual({ kind: 'over-60' })
    expect(formatYears(computed(result, 2).years)).toBe('60 年以上')
  })

  it('正好第 60 年达标也算 reached', () => {
    // A = 0、S = 1、r = 100%（上限之内），目标 2^60 − 1 以内可达
    const years = estimateYears(0, 1, 1, 2 ** 60 - 1)
    expect(years).toEqual({ kind: 'reached', years: 60 })
  })

  it('边界 3 补充：A = 0 且 S = 0 时灯塔一不适用，而不是除零', () => {
    const first = computeL1({ ...VECTOR, assets: 0, savings: 0 }).lighthouses[0]!
    expect(first.state).toBe('unavailable')
  })

  it('A 已超过目标 → 0 年', () => {
    expect(estimateYears(10 * WAN, 1, 0.1, 5 * WAN)).toEqual({ kind: 'reached', years: 0 })
  })

  it('浮点除法不把「刚好达标」算成未达标', () => {
    expect(estimateYears(100 * WAN, 0, 0.1, 100 * WAN)).toEqual({ kind: 'reached', years: 0 })
  })
})

describe('顶部结论', () => {
  it('全部达成 → all-achieved', () => {
    const result = computeL1({ ...VECTOR, assets: 1000 * WAN })
    expect(result.summary.kind).toBe('all-achieved')
    expect(result.summary.next).toBeNull()
  })

  it('都没达成 → 给出缺口最小的下一个', () => {
    const result = computeL1({ ...VECTOR, assets: 0 })
    expect(result.summary.kind).toBe('distance')
    expect(result.summary.nearest).toMatchObject({ index: 1, achieved: false })
    expect(result.summary.next).toMatchObject({ index: 1, gap: 100 * WAN })
  })

  it('缺口取的是「目标 − 当前」，不是百分比', () => {
    const result = computeL1({ ...VECTOR, assets: 150 * WAN })
    expect(result.summary.next).toMatchObject({ index: 2, gap: 50 * WAN })
  })
})

describe('参数范围提示', () => {
  it('提款率超出 2.5%–5% → 提示且灯塔三不计算', () => {
    const result = computeL1({ ...VECTOR, withdrawalPct: 6 })
    expect(validateInputs({ ...VECTOR, withdrawalPct: 6 }).withdrawalPct).toBe(MESSAGES.withdrawalOutOfRange)
    const third = result.lighthouses[2]!
    if (third.state !== 'unavailable') throw new Error('应当未计算')
    expect(third.reason).toBe('withdrawal-invalid')
    expect(result.lighthouses[0]!.state).toBe('computed')
  })

  it('合法区间两端都能算', () => {
    for (const withdrawalPct of [2.5, 5]) {
      const third = computeL1({ ...VECTOR, withdrawalPct }).lighthouses[2]
      expect(third.state).toBe('computed')
    }
  })

  it('正常输入没有任何提示', () => {
    expect(validateInputs(VECTOR)).toEqual({})
  })
})

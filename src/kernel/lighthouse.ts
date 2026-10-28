/**
 * L1 计算内核。
 *
 * 纯函数：输入 A / S / E / r / w，输出三个灯塔的目标资产、进度、预计年数、
 * 以及未计算时的状态文案。这里不碰 DOM、不碰 localStorage、不看时间。
 *
 * 口径（OPHE-29「三个灯塔」一节，写死）：
 *   灯塔一 A₁ = S / r  —— 资产年收益 = 年新增储蓄
 *   灯塔二 A₂ = E / r  —— 资产年收益 = 年开销
 *   灯塔三 A₃ = E / w  —— 可持续提款覆盖年开销
 *   进度 = min(A / Aₙ, 1) × 100%
 *   预计年数 = 使 A_t ≥ Aₙ 的最小整数 t，其中 A_{t+1} = A_t × (1 + r) + S
 */

import {
  MAX_YEARS,
  RETURN_PCT_MAX,
  RETURN_PCT_MIN_EXCLUSIVE,
  WITHDRAWAL_PCT_MAX,
  WITHDRAWAL_PCT_MIN,
} from './constants'
import type { FieldErrors, L1Inputs } from './parse'

export type LighthouseId = 'lighthouse-1' | 'lighthouse-2' | 'lighthouse-3'

export type UnavailableReason =
  | 'assets-missing'
  | 'savings-missing'
  | 'expenses-missing'
  | 'withdrawal-missing'
  | 'return-missing'
  | 'return-invalid'
  | 'withdrawal-invalid'
  | 'savings-not-positive'

/** 预计年数的四种结果；文案是产品口径，不在 UI 里另写一份 */
export type YearsEstimate =
  | { kind: 'reached'; years: number }
  | { kind: 'over-60' }
  | { kind: 'unreachable' }

interface LighthouseBase {
  id: LighthouseId
  index: 1 | 2 | 3
  /** 灯塔一 / 二 / 三 */
  name: string
  /** 卡片上写出的公式，例如 A₁ = S / r */
  formula: string
}

export interface ComputedLighthouse extends LighthouseBase {
  state: 'computed'
  /** 目标资产 Aₙ（元） */
  target: number
  /** 0..1，已达标为 1 */
  progress: number
  achieved: boolean
  years: YearsEstimate
}

export interface UnavailableLighthouse extends LighthouseBase {
  state: 'unavailable'
  reason: UnavailableReason
  /** 状态文案 */
  message: string
}

export type LighthouseResult = ComputedLighthouse | UnavailableLighthouse

export interface LighthouseRef {
  id: LighthouseId
  index: 1 | 2 | 3
  name: string
  target: number
}

/** 顶部结论用的「下一个灯塔」：还差多少靠 gap 表达，不靠文案 */
export interface NextTarget extends LighthouseRef {
  /** 目标资产 − 当前总资产，> 0 */
  gap: number
}

export type SummaryKind = 'incomplete' | 'all-achieved' | 'distance'

export interface Summary {
  kind: SummaryKind
  /** 进度最高的已计算灯塔（并列取编号小的） */
  nearest: (LighthouseRef & { progress: number; achieved: boolean }) | null
  /** 未达成中缺口最小的（并列取编号小的） */
  next: NextTarget | null
}

export interface L1Result {
  lighthouses: [LighthouseResult, LighthouseResult, LighthouseResult]
  summary: Summary
}

/** 产品口径固定的文案。UI 不许另写一份同义文案。 */
export const MESSAGES = {
  assetsMissing: '未填当前总资产',
  savingsMissing: '未填年新增储蓄',
  expensesMissing: '未填开销',
  withdrawalMissing: '未填提款率',
  returnMissing: '未填收益率',
  returnTooLow: '收益率需大于 0',
  returnTooHigh: `收益率需不超过 ${RETURN_PCT_MAX}%`,
  withdrawalOutOfRange: `提款率需在 ${WITHDRAWAL_PCT_MIN}%–${WITHDRAWAL_PCT_MAX}%`,
  savingsNotPositive: '储蓄为 0 或负，灯塔一不适用',
  achieved: '已达成',
  over60Years: '60 年以上',
  unreachable: '按当前储蓄无法到达',
} as const

/** 浮点比较容差：避免 100000 / 0.1 这类除法误差把「刚好达标」算成未达标 */
const EPSILON = 1e-9

/** 收益率问题：null 未填 / 文案 已填但不合法 */
function returnProblem(returnPct: number | null): string | null {
  if (returnPct === null) return MESSAGES.returnMissing
  if (returnPct <= RETURN_PCT_MIN_EXCLUSIVE) return MESSAGES.returnTooLow
  if (returnPct > RETURN_PCT_MAX) return MESSAGES.returnTooHigh
  return null
}

/** 提款率问题：null 未填 / 文案 已填但不合法 */
function withdrawalProblem(withdrawalPct: number | null): string | null {
  if (withdrawalPct === null) return MESSAGES.withdrawalMissing
  if (withdrawalPct < WITHDRAWAL_PCT_MIN || withdrawalPct > WITHDRAWAL_PCT_MAX) {
    return MESSAGES.withdrawalOutOfRange
  }
  return null
}

/** 依次查前置条件，返回第一个不满足的原因 */
function blockedReason(
  inputs: L1Inputs,
  needs: ReadonlyArray<'expenses' | 'withdrawal'>,
): { reason: UnavailableReason; message: string } | null {
  if (inputs.assets === null) {
    return { reason: 'assets-missing', message: MESSAGES.assetsMissing }
  }
  if (inputs.savings === null) {
    return { reason: 'savings-missing', message: MESSAGES.savingsMissing }
  }
  const returnIssue = returnProblem(inputs.returnPct)
  if (returnIssue === MESSAGES.returnMissing) {
    return { reason: 'return-missing', message: returnIssue }
  }
  if (returnIssue !== null) {
    return { reason: 'return-invalid', message: returnIssue }
  }
  if (needs.includes('expenses') && (inputs.expenses === null || inputs.expenses === 0)) {
    return { reason: 'expenses-missing', message: MESSAGES.expensesMissing }
  }
  if (needs.includes('withdrawal')) {
    const withdrawalIssue = withdrawalProblem(inputs.withdrawalPct)
    if (withdrawalIssue === MESSAGES.withdrawalMissing) {
      return { reason: 'withdrawal-missing', message: withdrawalIssue }
    }
    if (withdrawalIssue !== null) {
      return { reason: 'withdrawal-invalid', message: withdrawalIssue }
    }
  }
  return null
}

/**
 * 预计年数：使 A_t ≥ target 的最小整数 t（A_0 = A）。
 * S ≤ 0 且未达标 → 无法到达；60 年内没到 → 「60 年以上」。
 */
export function estimateYears(
  assets: number,
  savings: number,
  returnRate: number,
  target: number,
): YearsEstimate {
  const threshold = target * (1 - EPSILON)
  if (assets >= threshold) return { kind: 'reached', years: 0 }
  if (savings <= 0) return { kind: 'unreachable' }

  let current = assets
  for (let year = 1; year <= MAX_YEARS; year += 1) {
    current = current * (1 + returnRate) + savings
    if (current >= threshold) return { kind: 'reached', years: year }
  }
  return { kind: 'over-60' }
}

function progressOf(assets: number, target: number): number {
  if (assets >= target * (1 - EPSILON)) return 1
  return Math.min(assets / target, 1)
}

interface DefineLighthouseArgs {
  id: LighthouseId
  index: 1 | 2 | 3
  name: string
  formula: string
  target: number
  inputs: L1Inputs & { assets: number; savings: number; returnPct: number }
}

function computedLighthouse({ id, index, name, formula, target, inputs }: DefineLighthouseArgs): ComputedLighthouse {
  const returnRate = inputs.returnPct / 100
  return {
    id,
    index,
    name,
    formula,
    state: 'computed',
    target,
    progress: progressOf(inputs.assets, target),
    achieved: inputs.assets >= target * (1 - EPSILON),
    years: estimateYears(inputs.assets, inputs.savings, returnRate, target),
  }
}

function unavailableLighthouse(
  base: Pick<LighthouseBase, 'id' | 'index' | 'name' | 'formula'>,
  blocked: { reason: UnavailableReason; message: string },
): UnavailableLighthouse {
  return { ...base, state: 'unavailable', ...blocked }
}

const NAMES = ['灯塔一', '灯塔二', '灯塔三'] as const
const FORMULAS = ['A₁ = S / r', 'A₂ = E / r', 'A₃ = E / w'] as const

/**
 * 输入范围校验（字段级提示）。空值不算错误 —— 未填由各灯塔自己显示未计算状态。
 */
export function validateInputs(inputs: L1Inputs): FieldErrors {
  const errors: FieldErrors = {}
  if (inputs.assets !== null && inputs.assets < 0) {
    errors.assets = '当前总资产不能为负'
  }
  if (inputs.expenses !== null && inputs.expenses <= 0) {
    errors.expenses = '年生活开销需大于 0'
  }
  const returnIssue = returnProblem(inputs.returnPct)
  if (returnIssue !== null && returnIssue !== MESSAGES.returnMissing) {
    errors.returnPct = returnIssue
  }
  const withdrawalIssue = withdrawalProblem(inputs.withdrawalPct)
  if (withdrawalIssue !== null && withdrawalIssue !== MESSAGES.withdrawalMissing) {
    errors.withdrawalPct = withdrawalIssue
  }
  return errors
}

function summarize(lighthouses: ReadonlyArray<LighthouseResult>, assets: number | null): Summary {
  const computed = lighthouses.filter((item): item is ComputedLighthouse => item.state === 'computed')
  if (computed.length === 0 || assets === null) {
    return { kind: 'incomplete', nearest: null, next: null }
  }

  const byProgress = [...computed].sort(
    (a, b) => b.progress - a.progress || a.index - b.index,
  )
  const nearestItem = byProgress[0]!
  const nearest = {
    id: nearestItem.id,
    index: nearestItem.index,
    name: nearestItem.name,
    target: nearestItem.target,
    progress: nearestItem.progress,
    achieved: nearestItem.achieved,
  }

  const pending = computed
    .filter((item) => !item.achieved)
    .sort((a, b) => a.target - b.target || a.index - b.index)
  const nextItem = pending[0]

  if (nextItem === undefined) {
    return { kind: 'all-achieved', nearest, next: null }
  }

  return {
    kind: 'distance',
    nearest,
    next: {
      id: nextItem.id,
      index: nextItem.index,
      name: nextItem.name,
      target: nextItem.target,
      gap: Math.max(nextItem.target - assets, 0),
    },
  }
}

/** L1 全部计算入口 */
export function computeL1(inputs: L1Inputs): L1Result {
  const bases = NAMES.map((name, i) => ({
    id: (['lighthouse-1', 'lighthouse-2', 'lighthouse-3'] as const)[i]!,
    index: (i + 1) as 1 | 2 | 3,
    name,
    formula: FORMULAS[i]!,
  }))

  const build = (
    i: 0 | 1 | 2,
    needs: ReadonlyArray<'expenses' | 'withdrawal'>,
    targetOf: (filled: L1Inputs & { assets: number; savings: number; expenses: number; returnPct: number; withdrawalPct: number }) => number,
  ): LighthouseResult => {
    const base = bases[i]!
    const blocked = blockedReason(inputs, needs)
    if (blocked !== null) return unavailableLighthouse(base, blocked)

    // blockedReason 已保证这些字段非空；这里收窄类型
    const filled = inputs as L1Inputs & {
      assets: number
      savings: number
      expenses: number
      returnPct: number
      withdrawalPct: number
    }
    const target = targetOf(filled)
    if (target <= 0) {
      // 仅在 A₁ = S / r 且 S ≤ 0 时发生：目标资产不是正数，灯塔一不适用
      return unavailableLighthouse(base, {
        reason: 'savings-not-positive',
        message: MESSAGES.savingsNotPositive,
      })
    }
    return computedLighthouse({ ...base, target, inputs: filled })
  }

  const first = build(0, [], (v) => v.savings / (v.returnPct / 100))
  const second = build(1, ['expenses'], (v) => v.expenses / (v.returnPct / 100))
  const third = build(2, ['expenses', 'withdrawal'], (v) => v.expenses / (v.withdrawalPct / 100))

  return {
    lighthouses: [first, second, third],
    summary: summarize([first, second, third], inputs.assets),
  }
}

/** 年数文案（已达成 / N 年 / 60 年以上 / 无法到达） */
export function formatYears(years: YearsEstimate): string {
  switch (years.kind) {
    case 'reached':
      return years.years === 0 ? MESSAGES.achieved : `${years.years} 年`
    case 'over-60':
      return MESSAGES.over60Years
    case 'unreachable':
      return MESSAGES.unreachable
  }
}

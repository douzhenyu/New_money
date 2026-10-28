/**
 * 首页概览与本月流水的聚合口径（纯函数）。
 *
 * 口径（详见 CONTEXT.md「记账页概览」）：
 *   资产总额 = 测算页填的「当前总资产」− 记账以来的累计支出
 *   今日变动 = 0 − 今日支出（记支出为负）；百分比 = 今日变动 ÷ 今日开始时的资产
 *   当日小计 = 该日支出合计
 *
 * 为什么资产总额要减记账支出：首页是「资产概览 + 记账」，用户记的账要能看见对资产的影响；
 * 从 0 起算的「累计支出」不是资产，单独显示会把概念混掉。
 */

import { dayOfMonth, isInMonth, monthOf } from './dates'
import type { LedgerEntry } from './entries'

export interface DailyGroup {
  /** 'YYYY-MM-DD' */
  date: string
  /** 当天的条目，新记的在前 */
  entries: LedgerEntry[]
  /** 当日小计（支出合计，正数） */
  subtotal: number
  /** 当月第几天，展示用 */
  dayOfMonth: number
}

export interface AssetOverview {
  /** 'YYYY-MM' */
  month: string
  /** 资产总额；null = 测算页还没填当前总资产 */
  assets: number | null
  /** 今日变动金额（支出为负），没有记账就是 0 */
  todayChange: number
  /** 今日变动百分比；资产未知或今日开始时资产 ≤ 0 时为 null */
  todayChangePct: number | null
  /** 记账以来累计支出 */
  spentAllTime: number
  /** 本月支出合计 */
  spentThisMonth: number
  /** 今日支出合计 */
  spentToday: number
}

/** 日期倒序；同一天内按创建时间倒序，新记的在最上面 */
export function sortEntriesDesc(entries: readonly LedgerEntry[]): LedgerEntry[] {
  return [...entries].sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1))
}

export function sumAmount(entries: readonly LedgerEntry[]): number {
  return entries.reduce((total, entry) => total + entry.amount, 0)
}

/** 本月（按 today 所在月份）的条目，日期倒序 */
export function entriesInMonth(entries: readonly LedgerEntry[], today: string): LedgerEntry[] {
  const month = monthOf(today)
  return sortEntriesDesc(entries.filter((entry) => isInMonth(entry.date, month)))
}

/** 按日分组，日期倒序，每组给出当日小计 */
export function groupByDay(entries: readonly LedgerEntry[]): DailyGroup[] {
  const sorted = sortEntriesDesc(entries)
  const groups: DailyGroup[] = []
  for (const entry of sorted) {
    const last = groups.at(-1)
    if (last !== undefined && last.date === entry.date) {
      last.entries.push(entry)
      last.subtotal += entry.amount
      continue
    }
    groups.push({
      date: entry.date,
      entries: [entry],
      subtotal: entry.amount,
      dayOfMonth: dayOfMonth(entry.date),
    })
  }
  return groups
}

export function computeAssetOverview(args: {
  /** 测算页填的当前总资产；null = 未填 */
  planAssets: number | null
  entries: readonly LedgerEntry[]
  /** 'YYYY-MM-DD' 今天，由调用方注入，便于测试 */
  today: string
}): AssetOverview {
  const { planAssets, entries, today } = args
  const spentAllTime = sumAmount(entries)
  const spentToday = sumAmount(entries.filter((entry) => entry.date === today))
  const spentThisMonth = sumAmount(entries.filter((entry) => isInMonth(entry.date, monthOf(today))))

  const assets = planAssets === null ? null : planAssets - spentAllTime
  // 没有今日支出时给 0 而不是 -0（-0 会显示成「-0」，也能骗过 Object.is 之外的所有比较）
  const todayChange = spentToday === 0 ? 0 : -spentToday

  // 今日开始时的资产 = 现在资产 + 今日已支出
  const openingAssets = assets === null ? null : assets + spentToday
  const todayChangePct =
    openingAssets === null || openingAssets <= 0 ? null : todayChange / openingAssets

  return {
    month: monthOf(today),
    assets,
    todayChange,
    todayChangePct,
    spentAllTime,
    spentThisMonth,
    spentToday,
  }
}

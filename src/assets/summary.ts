/**
 * 资产页的聚合口径（纯函数）：
 *   总资产 = Σ marketValue(item)（股票/基金有份额与现价时按市值，否则按金额）
 *   浮动   = 总资产 − Σ amount（没有份额/现价的条目浮动为 0）
 *   占比   = 该类别计入值 ÷ 总资产
 *
 * 空类别（该类别没有任何条目）不出现在配置结构里 —— 不显示 0 条、不显示 0 金额。
 */

import { ASSET_CATEGORIES, categoryLabel } from './categories'
import { marketValue } from './holdings'
import type { AssetItem } from './holdings'

export interface CategoryGroup {
  category: string
  label: string
  /** 该类别计入总资产的金额 */
  amount: number
  /** 占总资产的比例 0..1 */
  share: number
  count: number
  /** 明细行，按金额降序 */
  items: AssetItem[]
}

export interface AssetSummary {
  /** 总资产 */
  total: number
  /** 全部条目的「金额」之和（股票/基金里是成本） */
  cost: number
  /** 浮动 = 总资产 − cost */
  floating: number
  /** 浮动 ÷ cost；cost ≤ 0 时为 null（不显示百分比） */
  floatingPct: number | null
  /** 配置结构：只含非空类别，金额降序 */
  groups: CategoryGroup[]
}

function categoryOrder(id: string): number {
  const index = ASSET_CATEGORIES.findIndex((category) => category.id === id)
  return index === -1 ? ASSET_CATEGORIES.length : index
}

/** 按类别分组：金额降序，同金额按类别定义顺序 */
export function groupByCategory(items: readonly AssetItem[]): CategoryGroup[] {
  const buckets = new Map<string, AssetItem[]>()
  for (const item of items) {
    const bucket = buckets.get(item.category)
    if (bucket === undefined) buckets.set(item.category, [item])
    else bucket.push(item)
  }

  const groups: CategoryGroup[] = []
  for (const [category, bucketItems] of buckets) {
    const amount = bucketItems.reduce((sum, item) => sum + marketValue(item), 0)
    groups.push({
      category,
      label: categoryLabel(category),
      amount,
      share: 0,
      count: bucketItems.length,
      items: [...bucketItems].sort(
        (a, b) => marketValue(b) - marketValue(a) || a.name.localeCompare(b.name, 'zh-CN'),
      ),
    })
  }

  return groups.sort((a, b) => b.amount - a.amount || categoryOrder(a.category) - categoryOrder(b.category))
}

export function summarize(items: readonly AssetItem[]): AssetSummary {
  const groups = groupByCategory(items)
  const total = groups.reduce((sum, group) => sum + group.amount, 0)
  const cost = items.reduce((sum, item) => sum + item.amount, 0)
  const floating = total - cost

  const withShare = groups.map((group) => ({
    ...group,
    share: total > 0 ? group.amount / total : 0,
  }))

  return {
    total,
    cost,
    floating,
    floatingPct: cost > 0 ? floating / cost : null,
    groups: withShare,
  }
}

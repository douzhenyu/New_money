/**
 * 资产类别：七个固定类别，术语记在 CONTEXT.md。
 *
 * 组件里不许出现「现金」「股票」这类中文字面量，一律 categoryLabel(id)。
 */

export interface AssetCategory {
  id: string
  label: string
  /** 是否可以带份额与现价（股票、基金按份额计价） */
  unitBased: boolean
}

/** 顺序即配置结构与明细分组的默认顺序 */
export const ASSET_CATEGORIES: readonly AssetCategory[] = [
  { id: 'cash', label: '现金', unitBased: false },
  { id: 'deposit', label: '存款', unitBased: false },
  { id: 'money-fund', label: '货币基金', unitBased: false },
  { id: 'stock', label: '股票', unitBased: true },
  { id: 'fund', label: '基金', unitBased: true },
  { id: 'bond', label: '债券', unitBased: false },
  { id: 'other', label: '其他', unitBased: false },
]

export const DEFAULT_CATEGORY_ID = 'cash'

export function isCategoryId(id: string): boolean {
  return ASSET_CATEGORIES.some((category) => category.id === id)
}

export function categoryLabel(id: string): string {
  return ASSET_CATEGORIES.find((category) => category.id === id)?.label ?? '其他'
}

/** 股票与基金可以填份额与现价，其余类别只能用金额 */
export function allowsUnits(id: string): boolean {
  return ASSET_CATEGORIES.find((category) => category.id === id)?.unitBased === true
}

export const CATEGORY_IDS: readonly string[] = ASSET_CATEGORIES.map((category) => category.id)

/**
 * 记账分类：一套默认值，术语记在 CONTEXT.md。
 * 组件里不许出现中文字面量，一律从这里的 id → label 取。
 */

export interface Category {
  id: string
  label: string
}

/** 顺序即下拉框顺序：先高频，最后兜底「其他」 */
export const DEFAULT_CATEGORIES: readonly Category[] = [
  { id: 'food', label: '餐饮' },
  { id: 'transport', label: '交通' },
  { id: 'housing', label: '居住' },
  { id: 'daily', label: '日用' },
  { id: 'medical', label: '医疗' },
  { id: 'study', label: '学习' },
  { id: 'fun', label: '娱乐' },
  { id: 'social', label: '人情' },
  { id: 'other', label: '其他' },
]

/** 新条目默认分类：兜底项，避免误记到具体类别 */
export const DEFAULT_CATEGORY_ID = 'other'

export function isCategoryId(id: string): boolean {
  return DEFAULT_CATEGORIES.some((category) => category.id === id)
}

export function categoryLabel(id: string): string {
  return DEFAULT_CATEGORIES.find((category) => category.id === id)?.label ?? '其他'
}

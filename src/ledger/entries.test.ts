import { describe, expect, it } from 'vitest'
import {
  draftToEntry,
  emptyDraft,
  NOTE_MAX_LENGTH,
  parseEntries,
  validateDraft,
} from './entries'
import type { EntryDraft } from './entries'
import { categoryLabel, DEFAULT_CATEGORIES, DEFAULT_CATEGORY_ID, isCategoryId } from './categories'

const TODAY = '2026-10-28'

function draft(overrides: Partial<EntryDraft> = {}): EntryDraft {
  return { ...emptyDraft(TODAY), amount: '28.5', ...overrides }
}

describe('记一笔的校验', () => {
  it('正常草稿没有错误', () => {
    expect(validateDraft(draft(), TODAY)).toEqual({})
  })

  it('金额为空 / 为 0 / 非数字都不能保存', () => {
    expect(validateDraft(draft({ amount: '' }), TODAY).amount).toBe('请填金额')
    expect(validateDraft(draft({ amount: '0' }), TODAY).amount).toBe('金额需大于 0')
    expect(validateDraft(draft({ amount: '-5' }), TODAY).amount).toBe('金额需大于 0')
    expect(validateDraft(draft({ amount: 'abc' }), TODAY).amount).toBe('请输入数字')
  })

  it('金额接受千分位与小数', () => {
    expect(validateDraft(draft({ amount: '1,280.50' }), TODAY)).toEqual({})
  })

  it('日期默认今天可以保存，未来日期不行', () => {
    expect(validateDraft(draft({ date: TODAY }), TODAY)).toEqual({})
    expect(validateDraft(draft({ date: '2026-10-29' }), TODAY).date).toBe('日期不能晚于今天')
    expect(validateDraft(draft({ date: '2026-10-27' }), TODAY)).toEqual({})
  })

  it('非法日期被挡住', () => {
    expect(validateDraft(draft({ date: '2026-02-30' }), TODAY).date).toBe('请填有效日期')
    expect(validateDraft(draft({ date: '' }), TODAY).date).toBe('请填有效日期')
  })

  it('分类必须在默认分类表里', () => {
    expect(validateDraft(draft({ category: 'food' }), TODAY)).toEqual({})
    expect(validateDraft(draft({ category: 'nope' }), TODAY).category).toBe('请选分类')
  })
})

describe('分类表', () => {
  it('就是约定的九个分类，顺序固定', () => {
    expect(DEFAULT_CATEGORIES.map((category) => category.label)).toEqual([
      '餐饮',
      '交通',
      '居住',
      '日用',
      '医疗',
      '学习',
      '娱乐',
      '人情',
      '其他',
    ])
  })

  it('默认分类是兜底的「其他」', () => {
    expect(isCategoryId(DEFAULT_CATEGORY_ID)).toBe(true)
    expect(categoryLabel(DEFAULT_CATEGORY_ID)).toBe('其他')
    expect(emptyDraft(TODAY).category).toBe(DEFAULT_CATEGORY_ID)
  })

  it('未知分类 id 回落到「其他」，不显示原始 id', () => {
    expect(categoryLabel('nope')).toBe('其他')
  })
})

describe('草稿 → 条目', () => {
  it('生成条目并去掉备注首尾空格', () => {
    const entry = draftToEntry(draft({ note: '  楼下面馆  ' }), {
      id: 'e1',
      createdAt: 1000,
      today: TODAY,
    })
    expect(entry).toEqual({
      id: 'e1',
      amount: 28.5,
      category: DEFAULT_CATEGORY_ID,
      date: TODAY,
      note: '楼下面馆',
      createdAt: 1000,
    })
  })

  it('备注超长截断', () => {
    const entry = draftToEntry(draft({ note: 'x'.repeat(200) }), {
      id: 'e2',
      createdAt: 1,
      today: TODAY,
    })
    expect(entry?.note).toHaveLength(NOTE_MAX_LENGTH)
  })

  it('校验不通过就不生成条目', () => {
    expect(draftToEntry(draft({ amount: '0' }), { id: 'e3', createdAt: 1, today: TODAY })).toBeNull()
    expect(draftToEntry(draft({ date: '2026-12-01' }), { id: 'e4', createdAt: 1, today: TODAY })).toBeNull()
  })
})

describe('读存储：坏数据逐条丢掉', () => {
  const valid = {
    id: 'ok',
    amount: 12,
    category: 'food',
    date: TODAY,
    note: '',
    createdAt: 1,
  }

  it('非数组 → 空列表', () => {
    expect(parseEntries(null)).toEqual([])
    expect(parseEntries({})).toEqual([])
    expect(parseEntries('nope')).toEqual([])
  })

  it('坏条目被丢弃，好条目保留', () => {
    const parsed = parseEntries([
      valid,
      { ...valid, id: 'neg', amount: -3 },
      { ...valid, id: 'zero', amount: 0 },
      { ...valid, id: 'badDate', date: '2026-02-30' },
      { ...valid, id: 'badCat', category: 'nope' },
      { ...valid, id: 'noAmount', amount: '12' },
      null,
      'x',
    ])
    expect(parsed.map((entry) => entry.id)).toEqual(['ok'])
  })

  it('重复 id 只留一条', () => {
    expect(parseEntries([valid, { ...valid }])).toHaveLength(1)
  })
})

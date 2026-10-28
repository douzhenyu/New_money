import { describe, expect, it } from 'vitest'
import {
  draftToItem,
  emptyDraft,
  floating,
  isAssetItem,
  itemToDraft,
  marketValue,
  NAME_MAX_LENGTH,
  parseItems,
  validateDraft,
} from './holdings'
import type { AssetDraft, AssetItem } from './holdings'
import { allowsUnits, ASSET_CATEGORIES, categoryLabel, DEFAULT_CATEGORY_ID, isCategoryId } from './categories'

function draft(overrides: Partial<AssetDraft> = {}): AssetDraft {
  return { ...emptyDraft(), name: '招行活期', amount: '5000', ...overrides }
}

const STOCK: AssetItem = {
  id: 's1',
  name: '贵州茅台',
  category: 'stock',
  amount: 10000,
  units: 10,
  price: 1685.65,
  createdAt: 1,
  updatedAt: 1,
}

describe('类别表', () => {
  it('就是约定的七个类别，顺序固定', () => {
    expect(ASSET_CATEGORIES.map((category) => category.label)).toEqual([
      '现金',
      '存款',
      '货币基金',
      '股票',
      '基金',
      '债券',
      '其他',
    ])
  })

  it('只有股票与基金可以带份额与现价', () => {
    expect(allowsUnits('stock')).toBe(true)
    expect(allowsUnits('fund')).toBe(true)
    for (const id of ['cash', 'deposit', 'money-fund', 'bond', 'other']) {
      expect(allowsUnits(id)).toBe(false)
    }
  })

  it('默认类别是现金；未知类别回落到「其他」', () => {
    expect(isCategoryId(DEFAULT_CATEGORY_ID)).toBe(true)
    expect(categoryLabel(DEFAULT_CATEGORY_ID)).toBe('现金')
    expect(categoryLabel('nope')).toBe('其他')
    expect(emptyDraft().category).toBe(DEFAULT_CATEGORY_ID)
  })
})

describe('资产表单校验', () => {
  it('正常草稿没有错误', () => {
    expect(validateDraft(draft())).toEqual({})
  })

  it('名称必填、有长度上限', () => {
    expect(validateDraft(draft({ name: '' })).name).toBe('请填名称')
    expect(validateDraft(draft({ name: '   ' })).name).toBe('请填名称')
    expect(validateDraft(draft({ name: 'x'.repeat(NAME_MAX_LENGTH + 1) })).name).toBe(
      `名称不超过 ${NAME_MAX_LENGTH} 字`,
    )
  })

  it('金额为空 / 为 0 / 负数 / 非数字都挡住', () => {
    expect(validateDraft(draft({ amount: '' })).amount).toBe('请填金额')
    expect(validateDraft(draft({ amount: '0' })).amount).toBe('金额需大于 0')
    expect(validateDraft(draft({ amount: '-3' })).amount).toBe('金额需大于 0')
    expect(validateDraft(draft({ amount: 'abc' })).amount).toBe('请输入数字')
  })

  it('类别必须在列表里', () => {
    expect(validateDraft(draft({ category: 'nope' })).category).toBe('请选类别')
  })

  it('份额与现价必须成对填', () => {
    const onlyUnits = validateDraft(draft({ category: 'stock', units: '10' }))
    expect(onlyUnits.price).toBe('份额与现价要一起填')
    const onlyPrice = validateDraft(draft({ category: 'stock', price: '12' }))
    expect(onlyPrice.units).toBe('份额与现价要一起填')
    expect(validateDraft(draft({ category: 'stock', units: '10', price: '12' }))).toEqual({})
  })

  it('份额与现价不能为 0 或负', () => {
    expect(validateDraft(draft({ category: 'fund', units: '0', price: '1' })).units).toBe('份额需大于 0')
    expect(validateDraft(draft({ category: 'fund', units: '1', price: '0' })).price).toBe('现价需大于 0')
  })

  it('非份额类类别忽略残留的份额与现价', () => {
    expect(validateDraft(draft({ category: 'cash', units: '10', price: '12' }))).toEqual({})
  })
})

describe('草稿 → 条目', () => {
  it('非份额类：份额与现价存成 null', () => {
    const item = draftToItem(draft({ name: '  招行活期  ' }), { id: 'x', now: 100 })
    expect(item).toMatchObject({
      id: 'x',
      name: '招行活期',
      category: 'cash',
      amount: 5000,
      units: null,
      price: null,
      createdAt: 100,
      updatedAt: 100,
    })
  })

  it('股票/基金：保留份额与现价，编辑时保留原 createdAt', () => {
    const item = draftToItem(draft({ category: 'stock', amount: '10000', units: '10', price: '1685.65' }), {
      id: 's1',
      now: 200,
      createdAt: 100,
    })
    expect(item).toMatchObject({ units: 10, price: 1685.65, createdAt: 100, updatedAt: 200 })
  })

  it('校验不通过就不生成条目', () => {
    expect(draftToItem(draft({ amount: '0' }), { id: 'x', now: 1 })).toBeNull()
    expect(draftToItem(draft({ name: '' }), { id: 'x', now: 1 })).toBeNull()
  })

  it('编辑回填：itemToDraft 能还原表单', () => {
    expect(itemToDraft(STOCK)).toEqual({
      name: '贵州茅台',
      category: 'stock',
      amount: '10000',
      units: '10',
      price: '1685.65',
    })
  })
})

describe('市值与浮动口径', () => {
  it('非份额类：市值就是金额', () => {
    const item: AssetItem = { ...STOCK, category: 'cash', units: null, price: null, amount: 5000 }
    expect(marketValue(item)).toBe(5000)
    expect(floating(item)).toBe(0)
  })

  it('股票/基金有份额与现价：市值 = 份额 × 现价，浮动 = 市值 − 成本', () => {
    expect(marketValue(STOCK)).toBeCloseTo(16856.5, 6)
    expect(floating(STOCK)).toBeCloseTo(6856.5, 6)
  })

  it('只有金额时退回金额，不把 null 当 0', () => {
    const item: AssetItem = { ...STOCK, units: null, price: null }
    expect(marketValue(item)).toBe(10000)
    expect(floating(item)).toBe(0)
  })

  it('下跌时浮动为负', () => {
    const item: AssetItem = { ...STOCK, units: 10, price: 800 }
    expect(floating(item)).toBe(8000 - 10000)
  })
})

describe('读存储：坏数据逐条丢掉', () => {
  it('非数组 → 空列表', () => {
    expect(parseItems(null)).toEqual([])
    expect(parseItems({})).toEqual([])
    expect(parseItems('x')).toEqual([])
  })

  it('坏条目被丢弃，好条目保留', () => {
    const good: AssetItem = { ...STOCK, id: 'ok', category: 'cash', units: null, price: null }
    const parsed = parseItems([
      good,
      { ...good, id: 'neg', amount: -1 },
      { ...good, id: 'badCat', category: 'nope' },
      { ...good, id: 'noName', name: '  ' },
      { ...good, id: 'halfUnits', category: 'stock', units: 10, price: null },
      { ...good, id: 'unitsOnCash', units: 10, price: 12 },
      null,
    ])
    expect(parsed.map((item) => item.id)).toEqual(['ok'])
  })

  it('重复 id 只留一条', () => {
    expect(parseItems([STOCK, { ...STOCK }])).toHaveLength(1)
  })

  it('isAssetItem 拒绝非对象', () => {
    expect(isAssetItem(null)).toBe(false)
    expect(isAssetItem('x')).toBe(false)
    expect(isAssetItem(STOCK)).toBe(true)
  })
})

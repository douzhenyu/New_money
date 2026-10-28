import { describe, expect, it } from 'vitest'
import { DEFAULT_FORM, isFormEmpty, loadForm, saveForm, STORAGE_KEY } from './storage'
import type { KeyValueStore } from './storage'
import type { L1Form } from './kernel/parse'

function memoryStore(initial: Record<string, string> = {}): KeyValueStore & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
  }
}

const FILLED: L1Form = {
  assets: '1500000',
  savings: '120000',
  expenses: '200000',
  returnPct: '8',
  withdrawalPct: '3.5',
}

describe('localStorage 持久化', () => {
  it('刷新后取回用户填的原始文本（未填仍是空串，不是 0）', () => {
    const store = memoryStore()
    const form: L1Form = { ...FILLED, expenses: '' }
    saveForm(store, form)
    expect(loadForm(store)).toEqual(form)
  })

  it('存的是文本而不是数字：0 与未填刷完还是两个样子', () => {
    const store = memoryStore()
    saveForm(store, { ...FILLED, assets: '0' })
    expect(loadForm(store).assets).toBe('0')
    saveForm(store, { ...FILLED, assets: '' })
    expect(loadForm(store).assets).toBe('')
  })

  it('首次打开用默认值：r = 10、w = 4，金额留空', () => {
    expect(loadForm(memoryStore())).toEqual(DEFAULT_FORM)
    expect(DEFAULT_FORM.returnPct).toBe('10')
    expect(DEFAULT_FORM.withdrawalPct).toBe('4')
    expect(DEFAULT_FORM.assets).toBe('')
  })

  it('存的内容坏掉时回落默认值，不抛错', () => {
    expect(loadForm(memoryStore({ [STORAGE_KEY]: 'not json' }))).toEqual(DEFAULT_FORM)
    expect(loadForm(memoryStore({ [STORAGE_KEY]: '[1,2,3]' }))).toEqual(DEFAULT_FORM)
    expect(loadForm(memoryStore({ [STORAGE_KEY]: 'null' }))).toEqual(DEFAULT_FORM)
  })

  it('字段类型不对时只回落该字段', () => {
    const store = memoryStore({ [STORAGE_KEY]: JSON.stringify({ assets: '100', savings: 500 }) })
    const form = loadForm(store)
    expect(form.assets).toBe('100')
    expect(form.savings).toBe('')
  })

  it('忽略多余字段，只认白名单', () => {
    const store = memoryStore({
      [STORAGE_KEY]: JSON.stringify({ assets: '100', evil: '<script>' }),
    })
    expect(Object.keys(loadForm(store)).sort()).toEqual(
      ['assets', 'expenses', 'returnPct', 'savings', 'withdrawalPct'].sort(),
    )
  })

  it('写入失败（隐私模式 / 配额满）返回 false，不炸页面', () => {
    const failing: KeyValueStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    expect(saveForm(failing, FILLED)).toBe(false)
    expect(loadForm(failing)).toEqual(DEFAULT_FORM)
  })

  it('空状态判定只看三个主输入', () => {
    expect(isFormEmpty(DEFAULT_FORM)).toBe(true)
    expect(isFormEmpty({ ...DEFAULT_FORM, assets: '0' })).toBe(false)
    expect(isFormEmpty({ ...DEFAULT_FORM, savings: '1' })).toBe(false)
    expect(isFormEmpty({ ...DEFAULT_FORM, expenses: '1' })).toBe(false)
    expect(isFormEmpty({ ...DEFAULT_FORM, returnPct: '12' })).toBe(true)
  })
})

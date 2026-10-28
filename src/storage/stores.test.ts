import { describe, expect, it } from 'vitest'
import type { KeyValueStore } from './types'
import { ASSETS_KEY, loadAssets, saveAssets } from './assetStore'
import {
  COLOR_SCHEME_KEY,
  loadColorScheme,
  loadWatchlist,
  saveColorScheme,
  saveWatchlist,
  WATCHLIST_KEY,
} from './watchStore'
import { QUOTES } from '../watch/market'
import type { AssetItem } from '../assets/holdings'

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

const ITEM: AssetItem = {
  id: 'a',
  name: '招行活期',
  category: 'cash',
  amount: 5000,
  units: null,
  price: null,
  createdAt: 1,
  updatedAt: 1,
}

describe('资产条目持久化', () => {
  it('存进去再读出来一致', () => {
    const store = memoryStore()
    expect(saveAssets(store, [ITEM])).toBe(true)
    expect(loadAssets(store)).toEqual([ITEM])
  })

  it('空存储 → 空列表（不崩）', () => {
    expect(loadAssets(memoryStore())).toEqual([])
  })

  it('坏 JSON / 坏条目不会让列表崩掉', () => {
    expect(loadAssets(memoryStore({ [ASSETS_KEY]: '{oops' }))).toEqual([])
    const store = memoryStore({
      [ASSETS_KEY]: JSON.stringify([ITEM, { ...ITEM, id: 'neg', amount: -1 }, { ...ITEM, id: 'cat', category: 'nope' }]),
    })
    expect(loadAssets(store).map((item) => item.id)).toEqual(['a'])
  })

  it('份额与现价必须成对出现', () => {
    const store = memoryStore({
      [ASSETS_KEY]: JSON.stringify([
        { ...ITEM, category: 'stock', units: 100, price: null },
        { ...ITEM, id: 'ok', category: 'stock', units: 100, price: 12 },
      ]),
    })
    expect(loadAssets(store).map((item) => item.id)).toEqual(['ok'])
  })

  it('写失败返回 false，不抛错', () => {
    const failing: KeyValueStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    expect(saveAssets(failing, [ITEM])).toBe(false)
    expect(loadAssets(failing)).toEqual([])
  })
})

describe('自选列表持久化', () => {
  it('存进去再读出来保持顺序', () => {
    const store = memoryStore()
    const symbols = [QUOTES[1]!.symbol, QUOTES[0]!.symbol]
    saveWatchlist(store, symbols)
    expect(loadWatchlist(store)).toEqual(symbols)
  })

  it('默认空自选（先看到空状态）', () => {
    expect(loadWatchlist(memoryStore())).toEqual([])
  })

  it('未知 symbol 与重复项被过滤', () => {
    const store = memoryStore({
      [WATCHLIST_KEY]: JSON.stringify([QUOTES[0]!.symbol, 'NOPE', QUOTES[0]!.symbol, 42]),
    })
    expect(loadWatchlist(store)).toEqual([QUOTES[0]!.symbol])
  })

  it('非数组内容 → 空列表', () => {
    expect(loadWatchlist(memoryStore({ [WATCHLIST_KEY]: '{"a":1}' }))).toEqual([])
    expect(loadWatchlist(memoryStore({ [WATCHLIST_KEY]: 'null' }))).toEqual([])
  })
})

describe('涨跌配色持久化', () => {
  it('默认红涨绿跌', () => {
    expect(loadColorScheme(memoryStore())).toBe('red-up')
  })

  it('切换后刷新仍然生效', () => {
    const store = memoryStore()
    saveColorScheme(store, 'green-up')
    expect(loadColorScheme(store)).toBe('green-up')
  })

  it('非法值回落默认，不白屏', () => {
    expect(loadColorScheme(memoryStore({ [COLOR_SCHEME_KEY]: '"blue-up"' }))).toBe('red-up')
    expect(loadColorScheme(memoryStore({ [COLOR_SCHEME_KEY]: 'broken' }))).toBe('red-up')
  })
})

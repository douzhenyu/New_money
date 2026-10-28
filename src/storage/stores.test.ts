import { describe, expect, it } from 'vitest'
import type { KeyValueStore } from '../storage'
import { ENTRIES_KEY, loadEntries, saveEntries } from './ledgerStore'
import {
  COLOR_SCHEME_KEY,
  loadColorScheme,
  loadWatchlist,
  saveColorScheme,
  saveWatchlist,
  WATCHLIST_KEY,
} from './watchStore'
import { QUOTES } from '../watch/quotes'
import type { LedgerEntry } from '../ledger/entries'

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

const ENTRY: LedgerEntry = {
  id: 'a',
  amount: 28.5,
  category: 'food',
  date: '2026-10-28',
  note: '面',
  createdAt: 1,
}

describe('记账条目持久化', () => {
  it('存进去再读出来一致', () => {
    const store = memoryStore()
    expect(saveEntries(store, [ENTRY])).toBe(true)
    expect(loadEntries(store)).toEqual([ENTRY])
  })

  it('空存储 → 空列表（不是崩溃）', () => {
    expect(loadEntries(memoryStore())).toEqual([])
  })

  it('坏 JSON / 坏条目不会让列表崩掉', () => {
    expect(loadEntries(memoryStore({ [ENTRIES_KEY]: '{oops' }))).toEqual([])
    const store = memoryStore({
      [ENTRIES_KEY]: JSON.stringify([ENTRY, { ...ENTRY, id: 'bad', amount: -1 }]),
    })
    expect(loadEntries(store).map((entry) => entry.id)).toEqual(['a'])
  })

  it('写失败返回 false，不抛错', () => {
    const failing: KeyValueStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    expect(saveEntries(failing, [ENTRY])).toBe(false)
    expect(loadEntries(failing)).toEqual([])
  })
})

describe('自选列表持久化', () => {
  it('存进去再读出来保持顺序', () => {
    const store = memoryStore()
    const symbols = [QUOTES[1]!.symbol, QUOTES[0]!.symbol]
    saveWatchlist(store, symbols)
    expect(loadWatchlist(store)).toEqual(symbols)
  })

  it('默认空自选（首页/盯盘先看到空状态）', () => {
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

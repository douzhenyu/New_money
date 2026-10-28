/** 大盘页的持久化：自选列表 + 涨跌配色 */

import type { KeyValueStore } from './types'
import { quoteBySymbol } from '../watch/market'
import { DEFAULT_COLOR_SCHEME, isColorScheme } from '../watch/settings'
import type { ColorScheme } from '../watch/settings'
import { readJson, writeJson } from './safeStore'

export const WATCHLIST_KEY = 'new-money.watch.list.v1'
export const COLOR_SCHEME_KEY = 'new-money.watch.colorScheme.v1'

/** 只保留示例池里真实存在的 symbol，去重（脏数据不会渲染出空行） */
export function loadWatchlist(store: KeyValueStore): string[] {
  const raw = readJson(store, WATCHLIST_KEY)
  if (!Array.isArray(raw)) return []
  const symbols: string[] = []
  const seen = new Set<string>()
  for (const item of raw) {
    if (typeof item !== 'string' || seen.has(item)) continue
    if (quoteBySymbol(item) === undefined) continue
    seen.add(item)
    symbols.push(item)
  }
  return symbols
}

export function saveWatchlist(store: KeyValueStore, symbols: readonly string[]): boolean {
  return writeJson(store, WATCHLIST_KEY, symbols)
}

export function loadColorScheme(store: KeyValueStore): ColorScheme {
  const raw = readJson(store, COLOR_SCHEME_KEY)
  return isColorScheme(raw) ? raw : DEFAULT_COLOR_SCHEME
}

export function saveColorScheme(store: KeyValueStore, scheme: ColorScheme): boolean {
  return writeJson(store, COLOR_SCHEME_KEY, scheme)
}

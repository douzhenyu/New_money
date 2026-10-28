/** 记账条目的持久化（key 带版本后缀，口径变了换版本号即可） */

import type { KeyValueStore } from '../storage'
import { parseEntries } from '../ledger/entries'
import type { LedgerEntry } from '../ledger/entries'
import { readJson, writeJson } from './safeStore'

export const ENTRIES_KEY = 'new-money.ledger.entries.v1'

/** 坏条目逐条丢掉，读到空数组也不会让页面崩 */
export function loadEntries(store: KeyValueStore): LedgerEntry[] {
  return parseEntries(readJson(store, ENTRIES_KEY))
}

export function saveEntries(store: KeyValueStore, entries: readonly LedgerEntry[]): boolean {
  return writeJson(store, ENTRIES_KEY, entries)
}

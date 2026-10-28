/** 资产条目的持久化（key 带版本后缀，口径变了换版本号即可） */

import type { KeyValueStore } from './types'
import { parseItems } from '../assets/holdings'
import type { AssetItem } from '../assets/holdings'
import { readJson, writeJson } from './safeStore'

export const ASSETS_KEY = 'new-money.assets.items.v1'

/** 坏条目逐条丢掉，读到空数组也不会让页面崩 */
export function loadAssets(store: KeyValueStore): AssetItem[] {
  return parseItems(readJson(store, ASSETS_KEY))
}

export function saveAssets(store: KeyValueStore, items: readonly AssetItem[]): boolean {
  return writeJson(store, ASSETS_KEY, items)
}

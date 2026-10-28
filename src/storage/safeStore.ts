/** localStorage 访问层：统一处理「读不到 / 读坏了 / 写不进去」 */

import type { KeyValueStore } from '../storage'

/**
 * 浏览器 localStorage；隐私模式或被禁用时退化成内存存储，
 * 页面照常能用，只是刷新后不保留。
 */
export function browserStore(): KeyValueStore {
  try {
    const storage = window.localStorage
    const probe = '__new_money_probe__'
    storage.setItem(probe, '1')
    storage.removeItem(probe)
    return storage
  } catch {
    const memory = new Map<string, string>()
    return {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => {
        memory.set(key, value)
      },
    }
  }
}

/** 读 JSON；不存在或解析失败都返回 null，不抛错 */
export function readJson(store: KeyValueStore, key: string): unknown {
  let raw: string | null
  try {
    raw = store.getItem(key)
  } catch {
    return null
  }
  if (raw === null) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

/** 写 JSON；失败返回 false（调用方决定是否提示用户） */
export function writeJson(store: KeyValueStore, key: string, value: unknown): boolean {
  try {
    store.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/** 条目 id：优先用 crypto.randomUUID，老浏览器退化成时间戳 + 随机串 */

export function newEntryId(): string {
  const cryptoApi = globalThis.crypto
  if (cryptoApi !== undefined && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

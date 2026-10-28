/** 存储层接口：只依赖这两个方法，测试里能塞假实现 */

export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

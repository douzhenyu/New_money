/**
 * 极简路由：三条路径，History API，无依赖、无状态管理。
 *
 * 之所以不引 react-router：只有三个静态页面，没有嵌套路由、没有 loader、没有搜索参数，
 * 一个 pathname → 页面的纯函数就够了（可单测）。
 *
 * 注意：path 路由在静态托管下需要 SPA 回退（任意路径都回 index.html），
 * 见 README「部署」一节。
 */

export const ROUTES = ['/', '/watch', '/plan'] as const

export type Route = (typeof ROUTES)[number]

/** 未知路径一律回首页，不给用户 404 空白页 */
export const DEFAULT_ROUTE: Route = '/'

/** 导航事件名：pushState 不会触发 popstate，自己补一个 */
const NAVIGATE_EVENT = 'new-money:navigate'

/** 把 location.pathname 归一化成已知路由（忽略末尾斜杠与大小写差异带来的意外） */
export function matchRoute(pathname: string): Route {
  const withoutTrailingSlash = pathname.replace(/\/+$/, '')
  const path = withoutTrailingSlash === '' ? '/' : withoutTrailingSlash
  return (ROUTES as readonly string[]).includes(path) ? (path as Route) : DEFAULT_ROUTE
}

/** 页面标题，随路由切换 */
export const ROUTE_TITLES: Record<Route, string> = {
  '/': '记账 · New money',
  '/watch': '盯盘 · New money',
  '/plan': '测算 · New money',
}

export function navigate(path: Route): void {
  if (window.location.pathname === path) return
  window.history.pushState({}, '', path)
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
}

export function onRouteChange(listener: () => void): () => void {
  window.addEventListener('popstate', listener)
  window.addEventListener(NAVIGATE_EVENT, listener)
  return () => {
    window.removeEventListener('popstate', listener)
    window.removeEventListener(NAVIGATE_EVENT, listener)
  }
}

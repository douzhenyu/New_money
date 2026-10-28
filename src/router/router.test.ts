import { describe, expect, it } from 'vitest'
import { DEFAULT_ROUTE, matchRoute, ROUTES, ROUTE_TITLES } from './router'

describe('路由匹配', () => {
  it('两条路径各自命中', () => {
    expect(matchRoute('/')).toBe('/')
    expect(matchRoute('/watch')).toBe('/watch')
  })

  it('末尾斜杠不影响结果', () => {
    expect(matchRoute('/watch/')).toBe('/watch')
    expect(matchRoute('/watch//')).toBe('/watch')
    expect(matchRoute('')).toBe('/')
  })

  it('未知路径回首页，不给空白页', () => {
    expect(matchRoute('/nope')).toBe(DEFAULT_ROUTE)
    expect(matchRoute('/watch/detail')).toBe(DEFAULT_ROUTE)
    expect(matchRoute('/WATCH')).toBe(DEFAULT_ROUTE)
    expect(matchRoute('/plan')).toBe(DEFAULT_ROUTE)
  })

  it('每个路由都有标题', () => {
    for (const route of ROUTES) {
      expect(ROUTE_TITLES[route].length).toBeGreaterThan(0)
    }
  })
})

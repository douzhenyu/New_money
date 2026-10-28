import { useEffect, useState } from 'react'
import { matchRoute, onRouteChange } from './router'
import type { Route } from './router'

/** 当前路由；监听浏览器前进后退与自己发起的 pushState */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => matchRoute(window.location.pathname))

  useEffect(() => {
    const sync = () => setRoute(matchRoute(window.location.pathname))
    sync()
    return onRouteChange(sync)
  }, [])

  return route
}

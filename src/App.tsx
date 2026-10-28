import { useEffect } from 'react'
import { AppNav } from './components/AppNav'
import { HomePage } from './pages/HomePage'
import { PlanPage } from './pages/PlanPage'
import { WatchPage } from './pages/WatchPage'
import { ROUTE_TITLES } from './router/router'
import { useRoute } from './router/useRoute'
import { browserStore } from './storage/safeStore'

/** 三个页面共用一个存储层（localStorage，不可用时退化成内存） */
const store = browserStore()

export default function App() {
  const route = useRoute()

  useEffect(() => {
    document.title = ROUTE_TITLES[route]
  }, [route])

  return (
    <div className="app">
      <AppNav route={route} />

      <main className="app__main">
        {route === '/' ? <HomePage store={store} /> : null}
        {route === '/watch' ? <WatchPage store={store} /> : null}
        {route === '/plan' ? <PlanPage store={store} /> : null}
      </main>

      <footer className="app__footer">
        <span className="disclaimer">仅记录与测算，不构成投资建议。</span>
        <span>行情为静态示例数据，不联网。</span>
        <span>数据只存在本机浏览器。</span>
      </footer>
    </div>
  )
}

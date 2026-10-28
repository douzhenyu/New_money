import { useEffect } from 'react'
import { AppNav } from './components/AppNav'
import { AssetsPage } from './pages/AssetsPage'
import { MarketPage } from './pages/MarketPage'
import { ROUTE_TITLES } from './router/router'
import { useRoute } from './router/useRoute'
import { browserStore } from './storage/safeStore'

/** 两个页面共用一个存储层（localStorage，不可用时退化成内存） */
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
        {route === '/' ? <AssetsPage store={store} /> : null}
        {route === '/watch' ? <MarketPage store={store} /> : null}
      </main>

      <footer className="app__footer">
        <span className="disclaimer">仅记录，不构成投资建议。</span>
        <span>行情为静态示例数据，不联网。</span>
        <span>数据只存在本机浏览器。</span>
      </footer>
    </div>
  )
}

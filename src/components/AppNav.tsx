import { navigate } from '../router/router'
import type { Route } from '../router/router'

const ITEMS: ReadonlyArray<{ route: Route; label: string }> = [
  { route: '/', label: '资产' },
  { route: '/watch', label: '大盘' },
]

export function AppNav({ route }: { route: Route }) {
  return (
    <header className="app__header">
      <span className="app__brand">New money</span>
      <nav className="nav" aria-label="主导航">
        {ITEMS.map((item) => {
          const active = item.route === route
          return (
            <a
              key={item.route}
              className={`nav__link${active ? ' nav__link--active' : ''}`}
              href={item.route}
              aria-current={active ? 'page' : undefined}
              onClick={(event) => {
                // 保留 cmd/ctrl 点击开新标签页的浏览器行为
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                event.preventDefault()
                navigate(item.route)
              }}
            >
              {item.label}
            </a>
          )
        })}
      </nav>
    </header>
  )
}

import { useMemo, useState } from 'react'
import { IndexCards } from '../components/IndexCards'
import { QuoteRow } from '../components/QuoteRow'
import type { KeyValueStore } from '../storage/types'
import {
  loadColorScheme,
  loadWatchlist,
  saveColorScheme,
  saveWatchlist,
} from '../storage/watchStore'
import { COLOR_SCHEMES, COLOR_SCHEME_LABELS } from '../watch/settings'
import { QUOTES, SUGGESTED_SYMBOLS, quotesForSymbols } from '../watch/market'

/**
 * 大盘页：指数卡片 + 自选列表。
 * 行情是静态假数据（src/watch/market.json），不接接口、不发网络请求。
 */
export function MarketPage({ store }: { store: KeyValueStore }) {
  const [symbols, setSymbols] = useState<string[]>(() => loadWatchlist(store))
  const [scheme, setScheme] = useState(() => loadColorScheme(store))
  const [picking, setPicking] = useState(false)

  const quotes = useMemo(() => quotesForSymbols(symbols), [symbols])
  const remaining = QUOTES.filter((quote) => !symbols.includes(quote.symbol))
  const suggestions = SUGGESTED_SYMBOLS.filter((symbol) => !symbols.includes(symbol))

  const setList = (next: string[]) => {
    setSymbols(next)
    saveWatchlist(store, next)
    if (next.length >= QUOTES.length) setPicking(false)
  }

  const toggleScheme = (next: (typeof COLOR_SCHEMES)[number]) => {
    setScheme(next)
    saveColorScheme(store, next)
  }

  return (
    <div className="market" data-color-scheme={scheme}>
      <div className="market__bar">
        <h2 className="market__title">大盘</h2>
        <div className="segmented" role="group" aria-label="涨跌配色">
          {COLOR_SCHEMES.map((option) => (
            <button
              key={option}
              type="button"
              className={`segmented__option${scheme === option ? ' segmented__option--active' : ''}`}
              aria-pressed={scheme === option}
              onClick={() => toggleScheme(option)}
            >
              {COLOR_SCHEME_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      <section className="panel" aria-labelledby="indices-title">
        <h3 className="panel__title" id="indices-title">
          指数
        </h3>
        <IndexCards />
      </section>

      <section className="panel" aria-labelledby="watchlist-title">
        <div className="panel__head">
          <div>
            <h3 className="panel__title" id="watchlist-title">
              自选
            </h3>
            <p className="panel__lead">
              共 {quotes.length} 个标的。行情为静态示例数据，不联网、不是实时价格。
            </p>
          </div>
          {remaining.length === 0 ? null : (
            <button
              className="button button--ghost button--small"
              type="button"
              aria-expanded={picking}
              onClick={() => setPicking((previous) => !previous)}
            >
              添加自选
            </button>
          )}
        </div>

        {picking ? (
          <div className="picker" aria-label="可添加的标的">
            {remaining.map((quote) => (
              <button
                key={quote.symbol}
                className="picker__chip"
                type="button"
                onClick={() => setList([...symbols, quote.symbol])}
              >
                + {quote.name}
              </button>
            ))}
          </div>
        ) : null}

        {quotes.length === 0 ? (
          <div className="market-empty">
            <p className="market-empty__title">还没有关注任何标的</p>
            <p className="market-empty__body">
              加几个常看的标的，开盘时一眼扫完涨跌。数据是示例，不会联网。
            </p>
            <div className="market-empty__actions">
              <button
                className="button button--primary"
                type="button"
                onClick={() => setList(suggestions)}
              >
                添加自选
              </button>
            </div>
            <div className="market-empty__suggestions">
              <span className="market-empty__suggestions-label">热门建议</span>
              {suggestions.map((symbol) => {
                const quote = QUOTES.find((candidate) => candidate.symbol === symbol)
                if (quote === undefined) return null
                return (
                  <button
                    key={symbol}
                    className="picker__chip"
                    type="button"
                    onClick={() => setList([...symbols, symbol])}
                  >
                    + {quote.name}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <ul className="quotes">
            {quotes.map((quote) => (
              <QuoteRow
                key={quote.symbol}
                quote={quote}
                onRemove={() => setList(symbols.filter((symbol) => symbol !== quote.symbol))}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Sparkline } from '../components/Sparkline'
import type { KeyValueStore } from '../storage'
import { COLOR_SCHEME_LABELS, COLOR_SCHEMES } from '../watch/settings'
import type { ColorScheme } from '../watch/settings'
import {
  QUOTES,
  directionOf,
  formatChangePct,
  formatPrice,
  quotesForSymbols,
} from '../watch/quotes'
import {
  loadColorScheme,
  loadWatchlist,
  saveColorScheme,
  saveWatchlist,
} from '../storage/watchStore'

/**
 * 盯盘页：L1 只有静态假数据（src/watch/quotes.json），不接行情接口、不发网络请求。
 * 自选与涨跌配色存 localStorage。
 */
export function WatchPage({ store }: { store: KeyValueStore }) {
  const [symbols, setSymbols] = useState<string[]>(() => loadWatchlist(store))
  const [scheme, setScheme] = useState<ColorScheme>(() => loadColorScheme(store))

  const quotes = useMemo(() => quotesForSymbols(symbols), [symbols])
  const remaining = QUOTES.filter((quote) => !symbols.includes(quote.symbol))

  const updateSymbols = (next: string[]) => {
    setSymbols(next)
    saveWatchlist(store, next)
  }

  const updateScheme = (next: ColorScheme) => {
    setScheme(next)
    saveColorScheme(store, next)
  }

  return (
    <div className="watch" data-color-scheme={scheme}>
      <section className="panel" aria-labelledby="watch-title">
        <div className="watch__head">
          <div>
            <h2 className="panel__title" id="watch-title">
              自选
            </h2>
            <p className="panel__lead">
              共 {quotes.length} 个标的。行情为静态示例数据，不联网、不是实时价格。
            </p>
          </div>
          <div className="segmented" role="group" aria-label="涨跌配色">
            {COLOR_SCHEMES.map((option) => (
              <button
                key={option}
                type="button"
                className={`segmented__option${scheme === option ? ' segmented__option--active' : ''}`}
                aria-pressed={scheme === option}
                onClick={() => updateScheme(option)}
              >
                {COLOR_SCHEME_LABELS[option]}
              </button>
            ))}
          </div>
        </div>

        {quotes.length === 0 ? (
          <div className="watch-empty">
            <p className="watch-empty__title">还没有关注任何标的</p>
            <p className="watch-empty__body">先把示例标的加进自选，看看列表长什么样。</p>
            <button
              className="button button--primary"
              type="button"
              onClick={() => updateSymbols(QUOTES.map((quote) => quote.symbol))}
            >
              添加示例标的
            </button>
          </div>
        ) : (
          <>
            <ul className="quotes">
              {quotes.map((quote) => {
                const direction = directionOf(quote.changePct)
                return (
                  <li className="quote" key={quote.symbol}>
                    <span className="quote__id">
                      <span className="quote__name">{quote.name}</span>
                      <span className="quote__symbol">{quote.symbol}</span>
                    </span>
                    <span className={`quote__spark quote__spark--${direction}`}>
                      <Sparkline trend={quote.trend} direction={direction} />
                    </span>
                    <span className="quote__figures">
                      <span className="quote__price">{formatPrice(quote.price)}</span>
                      <span className={`quote__change quote__change--${direction}`}>
                        {formatChangePct(quote.changePct)}
                      </span>
                    </span>
                    <button
                      className="quote__remove"
                      type="button"
                      aria-label={`移除${quote.name}`}
                      onClick={() => updateSymbols(symbols.filter((symbol) => symbol !== quote.symbol))}
                    >
                      ×
                    </button>
                  </li>
                )
              })}
            </ul>

            {remaining.length === 0 ? null : (
              <div className="watch__foot">
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={() => updateSymbols([...symbols, ...remaining.map((quote) => quote.symbol)])}
                >
                  再添加 {remaining.length} 个示例标的
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

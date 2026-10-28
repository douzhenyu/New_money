import { Sparkline } from './Sparkline'
import {
  directionOf,
  formatChangeAmount,
  formatChangePct,
  formatPrice,
} from '../watch/market'
import type { Quote } from '../watch/market'

/**
 * 一条自选：四段结构
 *   名称（主）/ 全称（次要灰字）/ 迷你走势 / 价格 + 涨跌额胶囊
 */
export function QuoteRow({ quote, onRemove }: { quote: Quote; onRemove: () => void }) {
  const direction = directionOf(quote.changePct)

  return (
    <li className="quote">
      <span className="quote__id">
        <span className="quote__name">{quote.name}</span>
        <span className="quote__full">{quote.fullName}</span>
      </span>

      <span className={`quote__spark sparkline--${direction}`}>
        <Sparkline trend={quote.trend} direction={direction} width={64} height={26} />
      </span>

      <span className="quote__figures">
        <span className="quote__price">{formatPrice(quote.price)}</span>
        <span className={`change-pill change-pill--${direction}`}>
          {formatChangeAmount(quote.changeAmount)} ({formatChangePct(quote.changePct)})
        </span>
      </span>

      <button
        className="quote__remove"
        type="button"
        aria-label={`移除${quote.name}`}
        onClick={onRemove}
      >
        ×
      </button>
    </li>
  )
}

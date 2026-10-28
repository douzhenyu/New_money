import { Sparkline } from './Sparkline'
import { directionOf, formatChangePct, formatIndexValue, INDICES } from '../watch/market'

/** 指数卡片：横向排列，移动端露出第 3 张的一半（暗示可滑） */
export function IndexCards() {
  return (
    <ul className="indices" aria-label="指数">
      {INDICES.map((index) => {
        const direction = directionOf(index.changePct)
        return (
          <li className="index-card" key={index.symbol}>
            <span className="index-card__name">{index.name}</span>
            <span className="index-card__value">{formatIndexValue(index.value)}</span>
            <span className={`change-pill change-pill--${direction}`}>
              {formatChangePct(index.changePct)}
            </span>
            <span className={`index-card__spark sparkline--${direction}`}>
              <Sparkline trend={index.trend} direction={direction} width={88} height={24} />
            </span>
          </li>
        )
      })}
    </ul>
  )
}

import { categoryLabel } from '../ledger/categories'
import { formatYuan } from '../ledger/format'
import type { DailyGroup } from '../ledger/summary'

function dayHeading(date: string, today: string): string {
  const month = Number(date.slice(5, 7))
  const day = Number(date.slice(8, 10))
  const weekday = '日一二三四五六'[new Date(`${date}T00:00:00`).getDay()] ?? ''
  const prefix = date === today ? '今天 · ' : ''
  return `${prefix}${month} 月 ${day} 日 周${weekday}`
}

export function EntryList({ groups, today }: { groups: readonly DailyGroup[]; today: string }) {
  if (groups.length === 0) {
    return (
      <div className="ledger-empty">
        <p className="ledger-empty__title">本月还没有记录</p>
        <p className="ledger-empty__body">左边填个金额就能记第一笔，几秒钟的事。</p>
      </div>
    )
  }

  return (
    <div className="ledger">
      {groups.map((group) => (
        <section className="ledger__day" key={group.date} aria-label={dayHeading(group.date, today)}>
          <header className="ledger__day-head">
            <h3 className="ledger__date">{dayHeading(group.date, today)}</h3>
            <span className="ledger__subtotal">小计 {formatYuan(group.subtotal)}</span>
          </header>
          <ul className="ledger__entries">
            {group.entries.map((entry) => (
              <li className="ledger__entry" key={entry.id}>
                <span className="ledger__entry-main">
                  <span className="ledger__entry-category">{categoryLabel(entry.category)}</span>
                  {entry.note === '' ? null : <span className="ledger__entry-note">{entry.note}</span>}
                </span>
                <span className="ledger__entry-amount">{formatYuan(entry.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

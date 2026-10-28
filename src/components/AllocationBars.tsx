import { formatShare, formatYuan } from '../assets/format'
import type { CategoryGroup } from '../assets/summary'

/** 配置结构：每个非空类别一条横条，金额 + 占比 */
export function AllocationBars({ groups }: { groups: readonly CategoryGroup[] }) {
  return (
    <ul className="allocation">
      {groups.map((group) => (
        <li className="allocation__row" key={group.category}>
          <div className="allocation__head">
            <span className="allocation__label">{group.label}</span>
            <span className="allocation__figures">
              <span className="allocation__amount">{formatYuan(group.amount)}</span>
              <span className="allocation__share">{formatShare(group.share)}</span>
            </span>
          </div>
          <div
            className="allocation__bar"
            role="img"
            aria-label={`${group.label} 占总资产 ${formatShare(group.share)}`}
          >
            <span
              className="allocation__fill"
              style={{ width: `${Math.min(Math.max(group.share, 0), 1) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

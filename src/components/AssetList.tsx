import { formatShare, formatSignedYuan, formatUnits, formatYuan } from '../assets/format'
import { floating, marketValue } from '../assets/holdings'
import type { AssetItem } from '../assets/holdings'
import type { CategoryGroup } from '../assets/summary'

interface AssetListProps {
  groups: readonly CategoryGroup[]
  editingId: string | null
  confirmingId: string | null
  onEdit: (id: string) => void
  onAskDelete: (id: string | null) => void
  onDelete: (id: string) => void
}

export function AssetList({
  groups,
  editingId,
  confirmingId,
  onEdit,
  onAskDelete,
  onDelete,
}: AssetListProps) {
  return (
    <div className="assets">
      {groups.map((group) => (
        <section className="assets__group" key={group.category} aria-label={group.label}>
          <header className="assets__group-head">
            <h3 className="assets__group-title">{group.label}</h3>
            <span className="assets__group-meta">
              {group.count} 项 · {formatYuan(group.amount)} · {formatShare(group.share)}
            </span>
          </header>
          <ul className="assets__items">
            {group.items.map((item) => (
              <AssetRow
                key={item.id}
                item={item}
                editing={editingId === item.id}
                confirming={confirmingId === item.id}
                onEdit={() => onEdit(item.id)}
                onAskDelete={() => onAskDelete(item.id)}
                onCancelDelete={() => onAskDelete(null)}
                onDelete={() => onDelete(item.id)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function AssetRow({
  item,
  editing,
  confirming,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  item: AssetItem
  editing: boolean
  confirming: boolean
  onEdit: () => void
  onAskDelete: () => void
  onCancelDelete: () => void
  onDelete: () => void
}) {
  const value = marketValue(item)
  const unitBased = item.units !== null && item.price !== null
  const profit = floating(item)

  return (
    <li className={`assets__item${editing ? ' assets__item--editing' : ''}`}>
      <div className="assets__item-main">
        <span className="assets__item-name">{item.name}</span>
        {unitBased ? (
          <span className="assets__item-detail">
            {formatUnits(item.units ?? 0)} 份 × {formatYuan(item.price ?? 0)} · 成本{' '}
            {formatYuan(item.amount)} · 浮动 {formatSignedYuan(profit)}
          </span>
        ) : null}
      </div>
      <span className="assets__item-amount">{formatYuan(value)}</span>

      {confirming ? (
        <span className="assets__item-actions">
          <button className="link-button link-button--danger" type="button" onClick={onDelete}>
            确认删除
          </button>
          <button className="link-button" type="button" onClick={onCancelDelete}>
            取消
          </button>
        </span>
      ) : (
        <span className="assets__item-actions">
          <button className="link-button" type="button" onClick={onEdit} disabled={editing}>
            编辑
          </button>
          <button className="link-button" type="button" onClick={onAskDelete}>
            删除
          </button>
        </span>
      )}
    </li>
  )
}

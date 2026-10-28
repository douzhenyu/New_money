import { useMemo, useState } from 'react'
import { AllocationBars } from '../components/AllocationBars'
import { AssetForm } from '../components/AssetForm'
import { AssetList } from '../components/AssetList'
import { formatSignedPct, formatSignedYuan, formatYuan } from '../assets/format'
import {
  draftToItem,
  emptyDraft,
  hasErrors,
  itemToDraft,
  newAssetId,
  validateDraft,
} from '../assets/holdings'
import type { AssetDraft, AssetDraftErrors, AssetDraftField, AssetItem } from '../assets/holdings'
import { summarize } from '../assets/summary'
import type { KeyValueStore } from '../storage/types'
import { loadAssets, saveAssets } from '../storage/assetStore'

type Editing =
  | { mode: 'create' }
  | { mode: 'edit'; id: string }
  | null

/**
 * 资产页：总资产 + 配置结构（按类别横条）+ 资产明细（可增删改）。
 *
 * 口径：总资产 = Σ「股票/基金按份额×现价，其余按金额」；库存类条目的
 * 「金额」是成本，市值与成本的差就是浮动。详见 CONTEXT.md。
 */
export function AssetsPage({ store }: { store: KeyValueStore }) {
  const [items, setItems] = useState<AssetItem[]>(() => loadAssets(store))
  const [editing, setEditing] = useState<Editing>(null)
  const [draft, setDraft] = useState<AssetDraft>(() => emptyDraft())
  const [touched, setTouched] = useState<Partial<Record<AssetDraftField, boolean>>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [saveFailed, setSaveFailed] = useState(false)

  const summary = useMemo(() => summarize(items), [items])

  const liveErrors = validateDraft(draft)
  const visibleErrors: AssetDraftErrors = {}
  for (const field of ['name', 'category', 'amount', 'units', 'price'] as const) {
    const message = liveErrors[field]
    if (message === undefined) continue
    if (touched[field] === true || submitAttempted) visibleErrors[field] = message
  }

  const persist = (next: AssetItem[]) => {
    setItems(next)
    setSaveFailed(!saveAssets(store, next))
  }

  const changeField = (field: AssetDraftField, value: string) => {
    setDraft((previous) => ({ ...previous, [field]: value }))
    setTouched((previous) => ({ ...previous, [field]: true }))
  }

  const startCreate = () => {
    setEditing({ mode: 'create' })
    setDraft(emptyDraft())
    setTouched({})
    setSubmitAttempted(false)
    setConfirmingId(null)
  }

  const startEdit = (id: string) => {
    const item = items.find((candidate) => candidate.id === id)
    if (item === undefined) return
    setEditing({ mode: 'edit', id })
    setDraft(itemToDraft(item))
    setTouched({})
    setSubmitAttempted(false)
    setConfirmingId(null)
  }

  const cancelEdit = () => {
    setEditing(null)
    setTouched({})
    setSubmitAttempted(false)
  }

  const submit = () => {
    setSubmitAttempted(true)
    if (hasErrors(liveErrors) || editing === null) return

    if (editing.mode === 'create') {
      const item = draftToItem(draft, { id: newAssetId(), now: Date.now() })
      if (item === null) return
      persist([...items, item])
    } else {
      const current = items.find((item) => item.id === editing.id)
      const updated = draftToItem(draft, {
        id: editing.id,
        now: Date.now(),
        createdAt: current?.createdAt,
      })
      if (updated === null) return
      persist(items.map((item) => (item.id === editing.id ? updated : item)))
    }

    setEditing(null)
    setTouched({})
    setSubmitAttempted(false)
  }

  const remove = (id: string) => {
    persist(items.filter((item) => item.id !== id))
    setConfirmingId(null)
    if (editing !== null && editing.mode === 'edit' && editing.id === id) setEditing(null)
  }

  return (
    <div className="assets-page">
      <section className="assets-hero" aria-label="总资产">
        <div className="assets-hero__head">
          <p className="assets-hero__label">总资产</p>
          <p className="assets-hero__value">{formatYuan(summary.total)}</p>
          <p className="assets-hero__change">
            <span className={summary.floating < 0 ? 'assets-hero__change--down' : undefined}>
              浮动 {formatSignedYuan(summary.floating)}
            </span>
            <span className="assets-hero__pct">{formatSignedPct(summary.floatingPct)}</span>
            <span className="assets-hero__cost">成本 {formatYuan(summary.cost)}</span>
          </p>
        </div>

        <button className="button button--primary" type="button" onClick={startCreate}>
          添加资产
        </button>
      </section>

      {saveFailed ? (
        <p className="warn" role="status">
          未能保存到本机，先保留本页；刷新后本次改动会丢。
        </p>
      ) : null}

      {editing === null ? null : (
        <section className="panel" aria-labelledby="asset-form-title">
          <h2 className="panel__title" id="asset-form-title">
            {editing.mode === 'create' ? '添加资产' : '编辑资产'}
          </h2>
          <p className="panel__lead">
            股票与基金可以只填金额，也可以填成本 + 份额 + 现价，按市值计入总资产。
          </p>
          <AssetForm
            draft={draft}
            errors={visibleErrors}
            mode={editing.mode}
            onChange={changeField}
            onSubmit={submit}
            onCancel={cancelEdit}
          />
        </section>
      )}

      {items.length === 0 ? (
        <section className="empty" aria-labelledby="assets-empty-title">
          <h2 className="empty__title" id="assets-empty-title">
            还没有资产
          </h2>
          <p className="empty__body">
            先记一条现在有什么：现金、存款、股票、基金都行。填完就能看到总资产和配置结构。
          </p>
          <button className="button button--primary" type="button" onClick={startCreate}>
            添加第一条资产
          </button>
        </section>
      ) : (
        <div className="assets-page__grid">
          <section className="panel" aria-labelledby="allocation-title">
            <h2 className="panel__title" id="allocation-title">
              配置结构
            </h2>
            <p className="panel__lead">按类别占总资产的比例。没有条目的类别不显示。</p>
            <AllocationBars groups={summary.groups} />
          </section>

          <section className="panel" aria-labelledby="assets-title">
            <h2 className="panel__title" id="assets-title">
              资产明细
            </h2>
            <p className="panel__lead">共 {items.length} 条，按类别分组。</p>
            <AssetList
              groups={summary.groups}
              editingId={editing !== null && editing.mode === 'edit' ? editing.id : null}
              confirmingId={confirmingId}
              onEdit={startEdit}
              onAskDelete={setConfirmingId}
              onDelete={remove}
            />
          </section>
        </div>
      )}
    </div>
  )
}

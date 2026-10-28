import { useMemo, useState } from 'react'
import { EntryForm } from '../components/EntryForm'
import { EntryList } from '../components/EntryList'
import { toISODate } from '../ledger/dates'
import {
  draftToEntry,
  emptyDraft,
  hasErrors,
  validateDraft,
} from '../ledger/entries'
import type { EntryDraft, EntryDraftErrors, LedgerEntry } from '../ledger/entries'
import { formatSignedPct, formatSignedYuan, formatYuan } from '../ledger/format'
import { newEntryId } from '../ledger/ids'
import { computeAssetOverview, entriesInMonth, groupByDay } from '../ledger/summary'
import { formatMoney } from '../kernel/format'
import { parseNumericInput } from '../kernel/parse'
import { loadForm } from '../storage'
import type { KeyValueStore } from '../storage'
import { loadEntries, saveEntries } from '../storage/ledgerStore'

/**
 * 首页 · 记账。
 * 资产总额来自「测算」页填的当前总资产减去记账以来的支出 —— 口径见 CONTEXT.md。
 */
export function HomePage({ store }: { store: KeyValueStore }) {
  const [today] = useState(() => toISODate(new Date()))
  const [entries, setEntries] = useState<LedgerEntry[]>(() => loadEntries(store))
  const [planAssets] = useState<number | null>(() => parseNumericInput(loadForm(store).assets).value)
  const [draft, setDraft] = useState<EntryDraft>(() => emptyDraft(today))
  const [touched, setTouched] = useState<Partial<Record<keyof EntryDraft, boolean>>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)

  const overview = useMemo(
    () => computeAssetOverview({ planAssets, entries, today }),
    [planAssets, entries, today],
  )
  const monthEntries = useMemo(() => entriesInMonth(entries, today), [entries, today])
  const groups = useMemo(() => groupByDay(monthEntries), [monthEntries])

  const liveErrors = validateDraft(draft, today)
  const canSubmit = !hasErrors(liveErrors)

  // 只提示用户碰过的字段，没动过的字段不预先报错
  const visibleErrors: EntryDraftErrors = {}
  for (const field of ['amount', 'category', 'date'] as const) {
    const message = liveErrors[field]
    if (message === undefined) continue
    if (touched[field] === true || submitAttempted) visibleErrors[field] = message
  }

  const changeField = (field: keyof EntryDraft, value: string) => {
    setDraft((previous) => ({ ...previous, [field]: value }))
    setTouched((previous) => ({ ...previous, [field]: true }))
  }

  const submit = () => {
    setSubmitAttempted(true)
    if (!canSubmit) return

    const entry = draftToEntry(draft, { id: newEntryId(), createdAt: Date.now(), today })
    if (entry === null) return

    // 列表立即出现，不等存储结果
    const next = [...entries, entry]
    setEntries(next)
    setSaveFailed(!saveEntries(store, next))
    setDraft((previous) => ({ ...previous, amount: '', note: '' }))
    setTouched({})
    setSubmitAttempted(false)
  }

  return (
    <div className="home">
      <section className="overview" aria-label="资产概览">
        <div className="overview__item">
          <span className="overview__label">资产总额</span>
          <span className="overview__value">
            {overview.assets === null ? '—' : formatMoney(overview.assets)}
          </span>
          <span className="overview__hint">
            {overview.assets === null
              ? '去「测算」填当前总资产后显示'
              : `测算页当前总资产 − 记账累计支出 ${formatYuan(overview.spentAllTime)}`}
          </span>
        </div>
        <div className="overview__item">
          <span className="overview__label">今日变动</span>
          <span
            className={`overview__value${overview.todayChange === 0 ? '' : ' overview__value--down'}`}
          >
            {formatSignedYuan(overview.todayChange)}
          </span>
          <span className="overview__hint">
            {formatSignedPct(overview.todayChangePct)} · 今日支出{' '}
            {formatYuan(overview.spentToday)}
          </span>
        </div>
      </section>

      <div className="home__grid">
        <section className="panel" aria-labelledby="entry-form-title">
          <h2 className="panel__title" id="entry-form-title">
            记一笔
          </h2>
          <p className="panel__lead">填金额、选分类、确认日期，点一下就存下。</p>
          <EntryForm
            draft={draft}
            errors={visibleErrors}
            canSubmit={canSubmit}
            onChange={changeField}
            onSubmit={submit}
            saveFailed={saveFailed}
          />
        </section>

        <section className="panel" aria-labelledby="ledger-title">
          <h2 className="panel__title" id="ledger-title">
            本月流水
          </h2>
          <p className="panel__lead">
            共 {monthEntries.length} 笔，按日分组，每天一个当日小计。
          </p>
          <EntryList groups={groups} today={today} />
        </section>
      </div>
    </div>
  )
}

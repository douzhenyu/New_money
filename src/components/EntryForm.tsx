import { DEFAULT_CATEGORIES } from '../ledger/categories'
import type { EntryDraft, EntryDraftErrors } from '../ledger/entries'
import { NumberField } from './NumberField'

interface EntryFormProps {
  draft: EntryDraft
  errors: EntryDraftErrors
  /** 保存按钮是否可用（金额等必填项就绪） */
  canSubmit: boolean
  onChange: (field: keyof EntryDraft, value: string) => void
  onSubmit: () => void
  saveFailed: boolean
}

export function EntryForm({ draft, errors, canSubmit, onChange, onSubmit, saveFailed }: EntryFormProps) {
  return (
    <form
      className="entry-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <div className="entry-form__amount">
        <NumberField
          id="entry-amount"
          label="金额"
          suffix="元"
          placeholder="0.00"
          value={draft.amount}
          error={errors.amount}
          onChange={(value) => onChange('amount', value)}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="entry-category">
          分类
        </label>
        <div className="field__control">
          <select
            id="entry-category"
            className="field__select"
            value={draft.category}
            aria-invalid={errors.category === undefined ? undefined : true}
            onChange={(event) => onChange('category', event.target.value)}
          >
            {DEFAULT_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        {errors.category === undefined ? (
          <p className="field__hint">不确定就选「其他」</p>
        ) : (
          <p className="field__error">{errors.category}</p>
        )}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="entry-date">
          日期
        </label>
        <div className={`field__control${errors.date === undefined ? '' : ' field__control--invalid'}`}>
          <input
            id="entry-date"
            className="field__input field__input--date"
            type="date"
            value={draft.date}
            onChange={(event) => onChange('date', event.target.value)}
          />
        </div>
        {errors.date === undefined ? null : <p className="field__error">{errors.date}</p>}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="entry-note">
          备注 <span className="field__optional">可留空</span>
        </label>
        <div className="field__control">
          <input
            id="entry-note"
            className="field__input field__input--note"
            type="text"
            maxLength={60}
            placeholder="比如：楼下面馆"
            value={draft.note}
            onChange={(event) => onChange('note', event.target.value)}
          />
        </div>
      </div>

      <button className="button button--primary" type="submit" disabled={!canSubmit}>
        记这一笔
      </button>

      {saveFailed ? (
        <p className="entry-form__warning" role="status">
          未能保存到本机，先保留本页；刷新后这笔会丢。
        </p>
      ) : null}
    </form>
  )
}

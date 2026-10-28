import { ASSET_CATEGORIES, allowsUnits } from '../assets/categories'
import type { AssetDraft, AssetDraftErrors, AssetDraftField } from '../assets/holdings'
import { NAME_MAX_LENGTH } from '../assets/holdings'
import { NumberField } from './NumberField'
import { TextField } from './TextField'

interface AssetFormProps {
  draft: AssetDraft
  errors: AssetDraftErrors
  mode: 'create' | 'edit'
  onChange: (field: AssetDraftField, value: string) => void
  onSubmit: () => void
  onCancel: () => void
}

export function AssetForm({ draft, errors, mode, onChange, onSubmit, onCancel }: AssetFormProps) {
  const unitBased = allowsUnits(draft.category)

  return (
    <form
      className="asset-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <TextField
        id="asset-name"
        label="名称"
        placeholder="比如：招商银行活期"
        maxLength={NAME_MAX_LENGTH}
        value={draft.name}
        error={errors.name}
        onChange={(value) => onChange('name', value)}
      />

      <div className="field">
        <label className="field__label" htmlFor="asset-category">
          类别
        </label>
        <div className="field__control">
          <select
            id="asset-category"
            className="field__select"
            value={draft.category}
            onChange={(event) => onChange('category', event.target.value)}
          >
            {ASSET_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        {errors.category === undefined ? null : <p className="field__error">{errors.category}</p>}
      </div>

      <NumberField
        id="asset-amount"
        label={unitBased ? '成本金额' : '金额'}
        suffix="元"
        placeholder="0.00"
        value={draft.amount}
        error={errors.amount}
        hint={unitBased ? '买入成本；填了份额与现价后按市值计入总资产' : '当前这部分资产值多少钱'}
        onChange={(value) => onChange('amount', value)}
      />

      {unitBased ? (
        <div className="asset-form__units">
          <NumberField
            id="asset-units"
            label="份额（可选）"
            placeholder="0"
            value={draft.units}
            error={errors.units}
            onChange={(value) => onChange('units', value)}
          />
          <NumberField
            id="asset-price"
            label="现价（可选）"
            suffix="元"
            placeholder="0.00"
            value={draft.price}
            error={errors.price}
            onChange={(value) => onChange('price', value)}
          />
        </div>
      ) : null}

      <div className="asset-form__actions">
        <button className="button button--primary" type="submit">
          {mode === 'create' ? '添加' : '保存修改'}
        </button>
        <button className="button button--ghost" type="button" onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  )
}

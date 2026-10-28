import type { ChangeEvent } from 'react'

interface TextFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string | undefined
  hint?: string | undefined
  error?: string | undefined
  maxLength?: number | undefined
}

/** 纯文本输入（名称、备注这类），跟 NumberField 共用同一套 .field 样式 */
export function TextField({ id, label, value, onChange, placeholder, hint, error, maxLength }: TextFieldProps) {
  const hintId = hint === undefined ? null : `${id}-hint`
  const errorId = error === undefined ? null : `${id}-error`
  const describedBy = [hintId, errorId].filter((item): item is string => item !== null).join(' ')

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className={`field__control${error === undefined ? '' : ' field__control--invalid'}`}>
        <input
          id={id}
          className="field__input field__input--text"
          type="text"
          autoComplete="off"
          maxLength={maxLength}
          value={value}
          placeholder={placeholder}
          aria-invalid={error === undefined ? undefined : true}
          aria-describedby={describedBy === '' ? undefined : describedBy}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        />
      </div>
      {hint === undefined ? null : (
        <p className="field__hint" id={hintId ?? undefined}>
          {hint}
        </p>
      )}
      {error === undefined ? null : (
        <p className="field__error" id={errorId ?? undefined} role="status">
          {error}
        </p>
      )}
    </div>
  )
}

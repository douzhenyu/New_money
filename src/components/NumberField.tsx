import type { ChangeEvent } from 'react'

interface NumberFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  /** 字段下方的常驻说明 */
  hint?: string | undefined
  /** 字段下方的错误提示（同时决定输入框描边） */
  error?: string | undefined
  /** 右侧单位，例如 元 / % */
  suffix?: string | undefined
  placeholder?: string | undefined
}

/**
 * 文本输入而不是 number 输入：需要保留「未填」与 0 的区别，
 * 也要接受千分位逗号。解析在内核里做（见 kernel/parse.ts）。
 */
export function NumberField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  suffix,
  placeholder = '未填',
}: NumberFieldProps) {
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
          className="field__input"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={value}
          placeholder={placeholder}
          aria-invalid={error === undefined ? undefined : true}
          aria-describedby={describedBy === '' ? undefined : describedBy}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        />
        {suffix === undefined ? null : <span className="field__suffix">{suffix}</span>}
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

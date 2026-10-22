import { shown, useSeparator } from '../settings/separator'

export interface NumberFieldProps {
  id?: string
  label: string
  value: string
  invalid: boolean
  onChange: (value: string) => void
}

// A decimal field kept as text, so an invalid value stays on screen as typed. The text is kept
// with a comma and shown with the chosen separator.
export function NumberField({ id, label, value, invalid, onChange }: NumberFieldProps) {
  const sep = useSeparator()
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        id={id}
        className="input"
        inputMode="decimal"
        value={shown(value, sep)}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(shown(e.target.value, sep))}
      />
    </label>
  )
}

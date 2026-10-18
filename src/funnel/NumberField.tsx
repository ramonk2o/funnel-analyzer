export interface NumberFieldProps {
  id?: string
  label: string
  value: string
  invalid: boolean
  onChange: (value: string) => void
}

// A decimal field kept as text, so an invalid value stays on screen as typed.
export function NumberField({ id, label, value, invalid, onChange }: NumberFieldProps) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        id={id}
        className="input"
        inputMode="decimal"
        value={value}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { texts } from '../texts'
import type { Theme } from '../theme/theme'
import type { Separator } from './separator'
import './settings.css'

const s = texts.settings

interface Props {
  theme: Theme
  onThemeChange: (theme: Theme) => void
  separator: Separator
  onSeparatorChange: (separator: Separator) => void
}

/** The gear button in the header and the settings modal it opens. Each choice applies right away. */
export function Settings(props: Props) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  function close() {
    setOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="btn btn-icon"
        aria-label={s.open}
        title={s.open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <GearIcon />
      </button>
      {open && createPortal(<Dialog {...props} onClose={close} />, document.body)}
    </>
  )
}

function Dialog({ theme, onThemeChange, separator, onSeparatorChange, onClose }: Props & { onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null)
  // Only a click that starts and ends on the dimmed background closes the modal, not a drag into or
  // out of it: the browser sends such a drag's click to the background, their common ancestor.
  const pressedOutside = useRef(false)
  const releasedOutside = useRef(false)

  // Opening focuses the first group's chosen option (the theme).
  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>('input:checked')?.focus()
  }, [])

  // Esc closes; Tab and Shift+Tab go around the modal's controls without leaving it.
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') return onClose()
    if (e.key !== 'Tab') return
    // In a radio group, only the checked option is a Tab stop.
    const stops = [...dialogRef.current!.querySelectorAll<HTMLElement>('input:checked, button')]
    const first = stops[0]
    const last = stops[stops.length - 1]
    // Clicking a spot with no control leaves the focus on the modal itself, outside the stops.
    const inStops = stops.includes(document.activeElement as HTMLElement)
    if (e.shiftKey && (document.activeElement === first || !inStops)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && (document.activeElement === last || !inStops)) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <div
      className="settings-backdrop"
      onPointerDown={(e) => (pressedOutside.current = e.target === e.currentTarget)}
      onPointerUp={(e) => (releasedOutside.current = e.target === e.currentTarget)}
      onClick={() => pressedOutside.current && releasedOutside.current && onClose()}
    >
      <div
        ref={dialogRef}
        className="card settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        // Focusable, so a click on a spot with no control keeps the focus (and Esc and Tab) in the modal.
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <h2 id="settings-title" className="settings-title">
          {s.title}
        </h2>
        <Choice name="theme" legend={s.theme} options={['dark', 'light']} value={theme} onChange={onThemeChange} />
        <Choice
          name="separator"
          legend={s.separator}
          options={['comma', 'dot']}
          value={separator}
          onChange={onSeparatorChange}
        />
        <div className="settings-actions">
          <button type="button" className="btn" onClick={onClose}>
            {s.close}
          </button>
        </div>
      </div>
    </div>
  )
}

interface ChoiceProps<T extends Theme | Separator> {
  name: string
  legend: string
  options: T[]
  value: T
  onChange: (value: T) => void
}

// A setting's options side by side, like the mode selector; the choice applies right away.
function Choice<T extends Theme | Separator>({ name, legend, options, value, onChange }: ChoiceProps<T>) {
  return (
    <fieldset className="settings-field">
      <legend className="field-label">{legend}</legend>
      <div className="mode-switch">
        {options.map((option) => (
          <label key={option} className="mode-option">
            <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} />
            <span>{s[option]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

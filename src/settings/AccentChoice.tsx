import { useState } from 'react'
import { texts } from '../texts'
import type { Theme } from '../theme/theme'
import { ACCENT_IDS, accentColors, parseHex, PRESETS, type AccentChoice as Choice } from './accent'

const a = texts.settings.accent

interface Props {
  theme: Theme
  choice: Choice
  onChange: (choice: Choice) => void
}

/** "Cor de destaque": a swatch per ready color, or a custom hex with the browser's color picker. */
export function AccentChoice({ theme, choice, onChange }: Props) {
  // The custom field as typed; an invalid value stays on screen while the last valid color is used.
  const [draft, setDraft] = useState(choice.custom ?? '')
  const inUse = accentColors(choice, theme)
  const invalid = parseHex(draft) === null

  function chooseCustom() {
    // The first time, it starts from the color that was chosen (its dark-theme version).
    const custom = choice.custom ?? PRESETS[choice.id === 'custom' ? 'violet' : choice.id].dark.accent
    setDraft(custom)
    onChange({ id: 'custom', custom })
  }

  function type(text: string) {
    setDraft(text)
    const hex = parseHex(text)
    if (hex) onChange({ id: 'custom', custom: hex })
  }

  return (
    <fieldset className="settings-field">
      <legend className="field-label">{a.label}</legend>
      <div className="accent-options">
        {ACCENT_IDS.map((id) => (
          <label key={id} className="accent-swatch" title={a.names[id]} style={{ background: PRESETS[id][theme].accent }}>
            <input
              type="radio"
              name="accent"
              aria-label={a.names[id]}
              checked={choice.id === id}
              onChange={() => onChange({ ...choice, id })}
            />
          </label>
        ))}
        <label className="mode-option accent-custom">
          <input type="radio" name="accent" checked={choice.id === 'custom'} onChange={chooseCustom} />
          <span>{a.custom}</span>
        </label>
      </div>
      {choice.id === 'custom' && (
        <div className="accent-custom-fields">
          <div className="accent-custom-row">
            <label className="field accent-hex">
              <span className="field-label">{a.hex}</span>
              <input
                className="input"
                value={draft}
                spellCheck={false}
                aria-invalid={invalid || undefined}
                onChange={(e) => type(e.target.value)}
              />
            </label>
            <input
              type="color"
              className="accent-picker"
              aria-label={a.picker}
              value={parseHex(draft) ?? choice.custom ?? '#000000'}
              onChange={(e) => type(e.target.value)}
            />
            <span className="accent-sample" role="img" aria-label={a.sample} style={{ backgroundColor: inUse.accent }} />
          </div>
          {inUse.adjusted && <p className="accent-adjusted">{a.adjusted}</p>}
        </div>
      )}
    </fieldset>
  )
}

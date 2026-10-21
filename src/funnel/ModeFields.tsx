import { texts } from '../texts'
import { stageDisplayName, type FunnelForm, type Mode } from './form'
import { NumberField } from './NumberField'

const t = texts.panel

export const BUDGET_FIELD_ID = 'budget'
export const GOAL_FIELD_ID = 'goal'

interface Props {
  form: FunnelForm
  invalid: Set<string>
  setField: (changes: Partial<FunnelForm>) => void
  onModeChange: (mode: Mode) => void
  /** Given (in a comparison), the mode is set elsewhere: no selector, only this mode's value. */
  mode?: Mode
}

// The mode selector and the value each mode starts from: the media budget, or the goal.
export function ModeFields({ form, invalid, setField, onModeChange, mode }: Props) {
  const shownMode = mode ?? form.mode
  // A goal never set starts at the last stage.
  const goalTarget = form.goalTarget || form.stages[form.stages.length - 1].id
  const revenue = goalTarget === 'revenue'
  return (
    <>
      {!mode && <ModeSwitch name="mode" mode={form.mode} onChange={onModeChange} />}

      {shownMode === 'budget' ? (
        <NumberField
          id={BUDGET_FIELD_ID}
          label={t.budget}
          value={form.budget}
          invalid={invalid.has('budget')}
          onChange={(budget) => setField({ budget })}
        />
      ) : (
        <div className="field-row">
          <label className="field">
            <span className="field-label">{t.goalTarget}</span>
            <select className="input" value={goalTarget} onChange={(e) => setField({ goalTarget: e.target.value })}>
              {form.stages.map((stage, i) => (
                <option key={stage.id} value={stage.id}>
                  {stageDisplayName(stage, i)}
                </option>
              ))}
              <option value="revenue">{t.revenueTarget}</option>
            </select>
          </label>
          <NumberField
            id={GOAL_FIELD_ID}
            label={revenue ? t.goalRevenue : t.goalQuantity}
            value={form.goal}
            invalid={invalid.has('goal')}
            onChange={(goal) => setField({ goal, goalTarget })}
          />
        </div>
      )}
    </>
  )
}

/** "Tenho um orçamento / Tenho uma meta". */
export function ModeSwitch({ name, mode, onChange }: { name: string; mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div className="mode-switch" role="radiogroup" aria-label={texts.mode.label}>
      {(['budget', 'goal'] as const).map((option) => (
        <label key={option} className="mode-option">
          <input
            type="radio"
            name={name}
            value={option}
            checked={mode === option}
            onChange={() => onChange(option)}
          />
          <span>{texts.mode[option]}</span>
        </label>
      ))}
    </div>
  )
}

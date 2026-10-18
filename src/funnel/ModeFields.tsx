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
}

// The mode selector and the value each mode starts from: the media budget, or the goal.
export function ModeFields({ form, invalid, setField, onModeChange }: Props) {
  const revenue = form.goalTarget === 'revenue'
  return (
    <>
      <div className="mode-switch" role="radiogroup" aria-label={texts.mode.label}>
        {(['budget', 'goal'] as const).map((mode) => (
          <label key={mode} className="mode-option">
            <input
              type="radio"
              name="mode"
              value={mode}
              checked={form.mode === mode}
              onChange={() => onModeChange(mode)}
            />
            <span>{texts.mode[mode]}</span>
          </label>
        ))}
      </div>

      {form.mode === 'budget' ? (
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
            <select
              className="input"
              value={form.goalTarget}
              onChange={(e) => setField({ goalTarget: e.target.value })}
            >
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
            onChange={(goal) => setField({ goal })}
          />
        </div>
      )}
    </>
  )
}

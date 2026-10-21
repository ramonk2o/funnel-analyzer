import { texts } from '../texts'
import { goalTargetIdOf, stageDisplayName, type FunnelForm, type Mode } from './form'
import { NumberField } from './NumberField'

const t = texts.panel

export const BUDGET_FIELD_ID = 'budget'
export const GOAL_FIELD_ID = 'goal'

interface Props {
  form: FunnelForm
  invalid: Set<string>
  setField: (changes: Partial<FunnelForm>) => void
  onModeChange: (mode: Mode) => void
  /** False in a comparison, where the mode is the comparison's. */
  showSwitch?: boolean
}

// The mode selector and the value each mode starts from: the media budget, or the goal.
export function ModeFields({ form, invalid, setField, onModeChange, showSwitch = true }: Props) {
  const goalTarget = goalTargetIdOf(form)
  return (
    <>
      {showSwitch && <ModeSwitch name="mode" mode={form.mode} onChange={onModeChange} />}

      {form.mode === 'budget' ? (
        <NumberField
          id={BUDGET_FIELD_ID}
          label={t.budget}
          value={form.budget}
          invalid={invalid.has('budget')}
          onChange={(budget) => setField({ budget })}
        />
      ) : (
        <GoalFields
          id={GOAL_FIELD_ID}
          stages={form.stages.map((stage, i) => ({ value: stage.id, label: stageDisplayName(stage, i) }))}
          target={goalTarget}
          onTarget={(target) => setField({ goalTarget: target })}
          goal={form.goal}
          invalid={invalid.has('goal')}
          // Typing a goal also keeps its target, so a goal never set stays at the stage shown.
          onGoal={(goal) => setField({ goal, goalTarget })}
        />
      )}
    </>
  )
}

interface GoalFieldsProps {
  id?: string
  /** The stages to aim at ("Receita" comes after them), each with its option value. */
  stages: { value: string; label: string }[]
  /** An option value, or 'revenue'. */
  target: string
  onTarget: (target: string) => void
  goal: string
  invalid: boolean
  onGoal: (goal: string) => void
}

/** "Meta em" (a stage or the revenue) and the goal: a quantity, or R$ for revenue. */
export function GoalFields({ id, stages, target, onTarget, goal, invalid, onGoal }: GoalFieldsProps) {
  return (
    <div className="field-row">
      <label className="field">
        <span className="field-label">{t.goalTarget}</span>
        <select className="input" value={target} onChange={(e) => onTarget(e.target.value)}>
          {stages.map((stage) => (
            <option key={stage.value} value={stage.value}>
              {stage.label}
            </option>
          ))}
          <option value="revenue">{t.revenueTarget}</option>
        </select>
      </label>
      <NumberField
        id={id}
        label={target === 'revenue' ? t.goalRevenue : t.goalQuantity}
        value={goal}
        invalid={invalid}
        onChange={onGoal}
      />
    </div>
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

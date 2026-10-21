import { calculateBudget, calculateGoal, type BudgetResult, type FunnelInput, type GoalTarget } from './calc'
import { goalTargetOf, readForm, setMode, type FunnelForm, type Mode } from './form'

// What the funnel shows: the last form that was fully valid (and, in goal mode, reachable), with its result.
export interface Calculated {
  form: FunnelForm
  input: FunnelInput
  result: BudgetResult
  /** Goal mode: the target and the investment needed to reach it. */
  goal?: { target: GoalTarget; investment: number }
}

export interface EditorState {
  form: FunnelForm
  invalid: Set<string>
  impossible: boolean
  /** Undefined until the form is valid once: a funnel opened with invalid fields has nothing to show. */
  calculated: Calculated | undefined
}

// Reads the form once per change; keeps the previous result while any field is invalid or the
// goal can't be reached.
export function editorState(form: FunnelForm, previous?: Calculated): EditorState {
  const { input, goal, invalid } = readForm(form)
  let calculated = previous
  let impossible = false
  if (input && goal) {
    const reached = calculateGoal({ ...input, target: goal.target, goal: goal.value })
    if (reached) {
      calculated = {
        form,
        input: { ...input, budget: reached.budget.media },
        result: reached.budget,
        goal: { target: goal.target, investment: reached.investment },
      }
    } else impossible = true
  } else if (input) {
    calculated = { form, input, result: calculateBudget(input) }
  }
  return { form, invalid, impossible, calculated }
}

export const editForm = (state: EditorState, change: (form: FunnelForm) => FunnelForm) =>
  editorState(change(state.form), state.calculated)

export function changeMode(state: EditorState, mode: Mode) {
  // What the funnel shows now at the goal's target: an empty goal starts from it.
  const result = state.calculated?.result
  return editForm(state, (form) => {
    const target = goalTargetOf(form)
    const shown = !result ? 0 : target === 'revenue' ? (result.revenue ?? 0) : (result.stages[target]?.volume ?? 0)
    return setMode(form, mode, shown)
  })
}

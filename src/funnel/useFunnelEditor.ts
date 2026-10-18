import { useState } from 'react'
import { calculateBudget, calculateGoal, type BudgetResult, type FunnelInput, type GoalTarget } from './calc'
import { initialForm, readForm, setMode, type FunnelForm, type Mode } from './form'

// What the funnel shows: the last form that was fully valid (and, in goal mode, reachable), with its result.
export interface Calculated {
  form: FunnelForm
  input: FunnelInput
  result: BudgetResult
  /** Goal mode: the target and the investment needed to reach it. */
  goal?: { target: GoalTarget; investment: number }
}

// Reads the form once per change; keeps the previous result while any field is invalid or the
// goal can't be reached.
function next(form: FunnelForm, previous?: Calculated) {
  const { input, goal, invalid } = readForm(form)
  let calculated = previous!
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

export function useFunnelEditor() {
  const [state, setState] = useState(() => next(initialForm()))

  function update(change: (form: FunnelForm) => FunnelForm) {
    setState((s) => next(change(s.form), s.calculated))
  }

  function changeMode(mode: Mode) {
    setState((s) => {
      const stages = s.calculated.result.stages
      return next(setMode(s.form, mode, stages[stages.length - 1].volume), s.calculated)
    })
  }

  return { ...state, update, changeMode }
}

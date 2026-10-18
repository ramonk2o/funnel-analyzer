import { useState } from 'react'
import { calculateBudget, type BudgetResult, type FunnelInput } from './calc'
import { initialForm, readForm, type FunnelForm } from './form'

// What the funnel shows: the last form that was fully valid, with its result.
export interface Calculated {
  form: FunnelForm
  input: FunnelInput
  result: BudgetResult
}

// Reads the form once per change; keeps the previous result while any field is invalid.
function next(form: FunnelForm, previous?: Calculated) {
  const { input, invalid } = readForm(form)
  const calculated = input ? { form, input, result: calculateBudget(input) } : previous!
  return { form, invalid, calculated }
}

export function useFunnelEditor() {
  const [state, setState] = useState(() => next(initialForm()))

  function update(change: (form: FunnelForm) => FunnelForm) {
    setState((s) => next(change(s.form), s.calculated))
  }

  return { ...state, update }
}

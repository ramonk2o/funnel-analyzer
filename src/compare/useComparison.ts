import { useState } from 'react'
import { goalTargetOf } from '../funnel/form'
import type { SavedFunnel } from '../funnels/storage'
import type { CompareSettings } from './scenario'

export const MAX_COMPARED = 3

export interface Comparison extends CompareSettings {
  /** The marked funnels, in the order they were marked; the first is the reference. */
  selected: string[]
}

// The comparison starts from the active funnel: marked, with its mode and its values.
function start(active: SavedFunnel): Comparison {
  const { form } = active
  return {
    selected: [active.id],
    mode: form.mode,
    shared: true,
    budget: form.budget,
    goalTarget: goalTargetOf(form),
    goal: form.goalTarget === '' ? '' : form.goal,
  }
}

/** The comparison on screen, or null. It lives only in this session. */
export function useComparison() {
  const [comparison, setComparison] = useState<Comparison | null>(null)

  return {
    comparison,
    start: (active: SavedFunnel) => setComparison(start(active)),
    stop: () => setComparison(null),
    change: (changes: Partial<Comparison>) => setComparison((c) => c && { ...c, ...changes }),
  }
}

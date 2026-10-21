import type { FunnelForm } from '../funnel/form'

export type Incompatibility = 'count' | 'names'

// Names compared without case or extra spaces.
const key = (name: string) => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR')

/**
 * Why a funnel can't be compared with the reference, or null if it can: it must have the same
 * number of stages, with the same names in the same order. Numbers and the cost unit may differ.
 */
export function incompatibility(reference: FunnelForm, other: FunnelForm): Incompatibility | null {
  if (reference.stages.length !== other.stages.length) return 'count'
  return reference.stages.every((s, i) => key(s.name) === key(other.stages[i].name)) ? null : 'names'
}

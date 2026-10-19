import { COST_UNITS } from '../funnel/calc'
import { MAX_STAGES, MIN_STAGES, newStage, type FunnelForm } from '../funnel/form'

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const allStrings = (o: Record<string, unknown>, keys: string[]) => keys.every((k) => typeof o[k] === 'string')

/**
 * Reads a funnel saved in the browser or in a file, or null if it isn't one. The stages get new
 * ids, so they never clash with the ones already on screen; the goal follows its stage.
 */
export function parseForm(value: unknown): FunnelForm | null {
  if (!isObject(value)) return null
  if (!allStrings(value, ['budget', 'goalTarget', 'goal', 'unitCost', 'ticket'])) return null
  if (value.mode !== 'budget' && value.mode !== 'goal') return null
  if (!(COST_UNITS as readonly unknown[]).includes(value.costUnit)) return null
  const { stages } = value
  if (!Array.isArray(stages) || stages.length < MIN_STAGES || stages.length > MAX_STAGES) return null
  if (!stages.every((s) => isObject(s) && allStrings(s, ['id', 'name', 'conversion', 'extraCost']))) return null

  const ids = new Map<string, string>()
  const newStages = (stages as Record<string, string>[]).map((s) => {
    const stage = { ...newStage(s.name, s.conversion), extraCost: s.extraCost }
    ids.set(s.id, stage.id)
    return stage
  })
  const target = value.goalTarget as string
  const goalTarget = target === '' || target === 'revenue' ? target : ids.get(target)
  if (goalTarget === undefined) return null

  return {
    mode: value.mode,
    budget: value.budget as string,
    goalTarget,
    goal: value.goal as string,
    costUnit: value.costUnit as FunnelForm['costUnit'],
    unitCost: value.unitCost as string,
    ticket: value.ticket as string,
    stages: newStages,
  }
}

export { isObject }

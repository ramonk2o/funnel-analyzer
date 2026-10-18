import type { CostUnit, FunnelInput, GoalTarget } from './calc'
import { parseDecimal } from './numbers'
import { texts } from '../texts'

// What the person typed, kept as text so an invalid field stays on screen as typed.
export interface StageForm {
  id: string
  name: string
  conversion: string
  extraCost: string
}

export type Mode = 'budget' | 'goal'

export interface FunnelForm {
  mode: Mode
  budget: string
  /** Goal mode: the target stage's id, or 'revenue'; '' until goal mode is first entered. */
  goalTarget: string
  goal: string
  costUnit: CostUnit
  unitCost: string
  ticket: string
  stages: StageForm[]
}

export const MIN_STAGES = 2
export const MAX_STAGES = 10

let nextId = 0
export function newStage(name: string, conversion = '10'): StageForm {
  return { id: `stage-${++nextId}`, name, conversion, extraCost: '' }
}

export function initialForm(): FunnelForm {
  return {
    mode: 'budget',
    budget: '2000',
    goalTarget: '',
    goal: '',
    costUnit: 'cpm',
    unitCost: '20',
    ticket: '',
    // The first stage's conversion is hidden; it shows if the stage is moved down.
    stages: texts.panel.sampleStageNames.map((name, i) => newStage(name, ['10', '2,5', '12', '15'][i])),
  }
}

export function addStage(form: FunnelForm): FunnelForm {
  if (form.stages.length >= MAX_STAGES) return form
  const names = new Set(form.stages.map((s) => s.name))
  let n = form.stages.length + 1
  while (names.has(texts.panel.newStageName(n))) n++
  const stage = newStage(texts.panel.newStageName(n))
  return { ...form, stages: [...form.stages, stage] }
}

export function removeStage(form: FunnelForm, id: string): FunnelForm {
  if (form.stages.length <= MIN_STAGES) return form
  const stages = form.stages.filter((s) => s.id !== id)
  // A goal on the removed stage moves to the last stage, keeping its value.
  const goalTarget = form.goalTarget === id ? stages[stages.length - 1].id : form.goalTarget
  return { ...form, stages, goalTarget }
}

/**
 * Switches mode. The first time goal mode is entered, the goal starts at the last stage with the
 * volume the funnel shows now (`lastVolume`), rounded up, so the funnel stays the same (or 1, if it's 0).
 */
export function setMode(form: FunnelForm, mode: Mode, lastVolume: number): FunnelForm {
  if (mode === 'goal' && form.goalTarget === '') {
    // A goal must be above zero: with no volume yet, it starts at 1.
    const goal = String(Math.max(1, Math.ceil(Math.round(lastVolume * 1e6) / 1e6)))
    return { ...form, mode, goalTarget: form.stages[form.stages.length - 1].id, goal }
  }
  return { ...form, mode }
}

export function updateStage(form: FunnelForm, id: string, changes: Partial<StageForm>): FunnelForm {
  return { ...form, stages: form.stages.map((s) => (s.id === id ? { ...s, ...changes } : s)) }
}

/** The name shown in the funnel: a blank name falls back to the stage's position. */
export function stageDisplayName(stage: StageForm, index: number): string {
  return stage.name.trim() || texts.funnel.unnamedStage(index + 1)
}

export function moveStage(form: FunnelForm, from: number, to: number): FunnelForm {
  if (to < 0 || to >= form.stages.length || from === to) return form
  const stages = [...form.stages]
  const [moved] = stages.splice(from, 1)
  stages.splice(to, 0, moved)
  return { ...form, stages }
}

export const stageField = (stageId: string, field: 'conversion' | 'extraCost') => `${stageId}.${field}`

export interface ReadResult {
  /** The funnel ready to calculate, or null while any field is invalid. In goal mode its budget is unused. */
  input: FunnelInput | null
  /** Goal mode: what to reach (null in budget mode or while invalid). */
  goal: { target: GoalTarget; value: number } | null
  /** Keys of the invalid fields: 'budget', 'goal', 'unitCost', 'ticket' or a stageField(). */
  invalid: Set<string>
}

export function readForm(form: FunnelForm): ReadResult {
  const invalid = new Set<string>()

  function read(key: string, text: string, ok: (n: number) => boolean): number {
    const n = parseDecimal(text)
    if (n === null || !ok(n)) {
      invalid.add(key)
      return 0
    }
    return n
  }
  // Optional fields: blank means "not informed".
  const readOptional = (key: string, text: string, ok: (n: number) => boolean) =>
    text.trim() === '' ? undefined : read(key, text, ok)

  const atLeastZero = (n: number) => n >= 0
  const goalMode = form.mode === 'goal'
  // Only the current mode's value counts: the other one is kept but not used.
  const budget = goalMode ? 0 : read('budget', form.budget, atLeastZero)
  const goalValue = goalMode ? read('goal', form.goal, (n) => n > 0) : 0
  const unitCost = read('unitCost', form.unitCost, (n) => n > 0)
  const ticket = readOptional('ticket', form.ticket, atLeastZero)
  const stages = form.stages.map((stage, i) => ({
    conversion: i === 0 ? 0 : read(stageField(stage.id, 'conversion'), stage.conversion, (n) => n <= 100),
    extraCost: readOptional(stageField(stage.id, 'extraCost'), stage.extraCost, atLeastZero) ?? 0,
  }))

  const input = invalid.size === 0 ? { budget, costUnit: form.costUnit, unitCost, ticket, stages } : null
  const goal = input && goalMode ? { target: goalTargetIndex(form), value: goalValue } : null
  return { input, goal, invalid }
}

function goalTargetIndex(form: FunnelForm): GoalTarget {
  if (form.goalTarget === 'revenue') return 'revenue'
  const i = form.stages.findIndex((s) => s.id === form.goalTarget)
  return i === -1 ? form.stages.length - 1 : i
}

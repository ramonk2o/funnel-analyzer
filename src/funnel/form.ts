import type { CostUnit, FunnelInput } from './calc'
import { parseDecimal } from './numbers'
import { texts } from '../texts'

// What the person typed, kept as text so an invalid field stays on screen as typed.
export interface StageForm {
  id: string
  name: string
  conversion: string
  extraCost: string
}

export interface FunnelForm {
  budget: string
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
    budget: '2000',
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
  return { ...form, stages: form.stages.filter((s) => s.id !== id) }
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
  /** The funnel ready to calculate, or null while any field is invalid. */
  input: FunnelInput | null
  /** Keys of the invalid fields: 'budget', 'unitCost', 'ticket' or a stageField(). */
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
  const budget = read('budget', form.budget, atLeastZero)
  const unitCost = read('unitCost', form.unitCost, (n) => n > 0)
  const ticket = readOptional('ticket', form.ticket, atLeastZero)
  const stages = form.stages.map((stage, i) => ({
    conversion: i === 0 ? 0 : read(stageField(stage.id, 'conversion'), stage.conversion, (n) => n <= 100),
    extraCost: readOptional(stageField(stage.id, 'extraCost'), stage.extraCost, atLeastZero) ?? 0,
  }))

  const input = invalid.size === 0 ? { budget, costUnit: form.costUnit, unitCost, ticket, stages } : null
  return { input, invalid }
}

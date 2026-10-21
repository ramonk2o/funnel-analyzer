import { addStage, MAX_STAGES, moveStage, newStage, removeStage, updateStage, type FunnelForm } from '../funnel/form'

// Changes to the stages' names, order and number apply to every compared funnel, by position;
// each stage keeps its own numbers in each funnel.

export function addStageToAll(forms: FunnelForm[]): FunnelForm[] {
  if (forms[0].stages.length >= MAX_STAGES) return forms
  // The new stage's name is worked out once, from the first funnel.
  const { name } = addStage(forms[0]).stages.at(-1)!
  return forms.map((form) => ({ ...form, stages: [...form.stages, newStage(name)] }))
}

// removeStage keeps the minimum of stages in each funnel.
export const removeStageFromAll = (forms: FunnelForm[], index: number) =>
  forms.map((form) => removeStage(form, form.stages[index].id))

export const moveStageInAll = (forms: FunnelForm[], from: number, to: number) =>
  forms.map((form) => moveStage(form, from, to))

export const renameStageInAll = (forms: FunnelForm[], index: number, name: string) =>
  forms.map((form) => updateStage(form, form.stages[index].id, { name }))

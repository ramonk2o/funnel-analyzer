import type { FunnelForm } from '../funnel/form'

// A form without its internal stage ids, with the goal target as a position: what the person sees.
export function formShape(form: FunnelForm) {
  const { stages, goalTarget, ...rest } = form
  const target = goalTarget === '' || goalTarget === 'revenue' ? goalTarget : stages.findIndex((s) => s.id === goalTarget)
  return { ...rest, goalTarget: target, stages: stages.map(({ id: _id, ...s }) => s) }
}

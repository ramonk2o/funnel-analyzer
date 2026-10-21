import type { FunnelForm, Mode } from '../funnel/form'

export interface CompareSettings {
  mode: Mode
  /** One budget (or goal) for every funnel. */
  shared: boolean
  budget: string
  /** The shared goal's stage, by position, or the revenue. */
  goalTarget: number | 'revenue'
  goal: string
}

/**
 * The form a compared funnel is calculated with: the comparison's mode and, when shared, its
 * budget or goal (the goal at the same position in every funnel). Otherwise each funnel's own
 * value; a goal never set stays empty, at the last stage, and so is invalid.
 */
export function comparedForm(form: FunnelForm, settings: CompareSettings): FunnelForm {
  const last = form.stages[form.stages.length - 1].id
  if (!settings.shared) return { ...form, mode: settings.mode, goalTarget: form.goalTarget || last }
  const { goalTarget } = settings
  return {
    ...form,
    mode: settings.mode,
    budget: settings.budget,
    goal: settings.goal,
    goalTarget: goalTarget === 'revenue' ? 'revenue' : (form.stages[goalTarget]?.id ?? last),
  }
}

/**
 * Where the shared goal's stage ends up after the stages change, so it follows its stage like each
 * funnel's own goal does: moved with it, or to the last stage (of `count`) if it was removed.
 */
export function followTarget(
  target: CompareSettings['goalTarget'],
  change: { from: number; to: number } | { removed: number },
  count: number,
): CompareSettings['goalTarget'] {
  if (target === 'revenue') return target
  if ('removed' in change) {
    if (change.removed === target) return count - 1
    return change.removed < target ? target - 1 : target
  }
  const { from, to } = change
  if (target === from) return to
  if (from < target && target <= to) return target - 1
  if (to <= target && target < from) return target + 1
  return target
}

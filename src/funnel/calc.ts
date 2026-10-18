export const COST_UNITS = ['cpm', 'cpc', 'unit'] as const
export type CostUnit = (typeof COST_UNITS)[number]

export interface StageInput {
  /** Percent of the previous stage (ignored on the first stage). */
  conversion: number
  /** Extra cost per unit at this stage; 0 when not informed. */
  extraCost: number
}

export interface FunnelInput {
  /** Media budget. */
  budget: number
  costUnit: CostUnit
  /** Media cost of the first stage, in costUnit. */
  unitCost: number
  stages: StageInput[]
  ticket?: number
}

export interface StageResult {
  volume: number
  extraCost: number
  /** Cumulative cost up to this stage ÷ its volume; null when the volume is 0. */
  costPerResult: number | null
}

export interface BudgetResult {
  stages: StageResult[]
  media: number
  extraCosts: number
  totalCost: number
  revenue: number | null
  roas: number | null
  roi: number | null
}

function firstVolume(budget: number, unit: CostUnit, unitCost: number): number {
  return unit === 'cpm' ? (budget / unitCost) * 1000 : budget / unitCost
}

export function calculateBudget(input: FunnelInput): BudgetResult {
  const media = input.budget
  let volume = firstVolume(media, input.costUnit, input.unitCost)
  let extraCosts = 0

  const stages = input.stages.map((stage, i) => {
    if (i > 0) volume *= stage.conversion / 100
    const extraCost = volume * stage.extraCost
    extraCosts += extraCost
    return { volume, extraCost, costPerResult: volume > 0 ? (media + extraCosts) / volume : null }
  })

  const totalCost = media + extraCosts
  const revenue = input.ticket === undefined ? null : volume * input.ticket
  return {
    stages,
    media,
    extraCosts,
    totalCost,
    revenue,
    roas: revenue === null || media === 0 ? null : revenue / media,
    roi: revenue === null || totalCost === 0 ? null : (revenue - totalCost) / totalCost,
  }
}

/** A stage's index, or the revenue (which needs a ticket). */
export type GoalTarget = number | 'revenue'

export interface GoalInput extends Omit<FunnelInput, 'budget'> {
  target: GoalTarget
  /** Quantity at the target stage, or revenue in R$. */
  goal: number
}

export interface GoalResult {
  /** Media plus extra costs needed to reach the goal, rounded up to the cent. */
  investment: number
  /** The funnel calculated with the media part of that investment. */
  budget: BudgetResult
}

/**
 * The investment needed to reach a goal, or null when no investment can reach it (a 0% conversion
 * before the target, or a revenue goal without a ticket). Volumes and extra costs grow in proportion
 * to the media, so the funnel is worked out per real of media and scaled.
 */
export function calculateGoal(input: GoalInput): GoalResult | null {
  const perReal = calculateBudget({ ...input, budget: 1 })
  const reachedPerReal = input.target === 'revenue' ? (perReal.revenue ?? 0) : perReal.stages[input.target].volume
  if (!(reachedPerReal > 0)) return null

  const totalPerReal = 1 + perReal.extraCosts
  const investment = ceilToCent((input.goal / reachedPerReal) * totalPerReal)
  return { investment, budget: calculateBudget({ ...input, budget: investment / totalPerReal }) }
}

// Rounds up to the cent, ignoring floating-point noise (2000.0000000001 stays 2000).
function ceilToCent(value: number): number {
  return Math.ceil(Math.round(value * 1e6) / 1e4) / 100
}

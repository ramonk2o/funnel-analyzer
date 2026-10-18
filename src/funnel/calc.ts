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

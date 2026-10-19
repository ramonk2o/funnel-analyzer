import { initialForm, newStage, type FunnelForm } from '../funnel/form'
import type { CostUnit } from '../funnel/calc'
import { texts } from '../texts'

export const TEMPLATE_IDS = ['blank', 'paidTraffic', 'ecommerce', 'b2b'] as const
export type TemplateId = (typeof TEMPLATE_IDS)[number]

interface Template {
  costUnit: CostUnit
  unitCost: string
  /** Conversions of the stages after the first. */
  conversions: string[]
  budget: string
  ticket: string
}

const templates: Record<Exclude<TemplateId, 'blank'>, Template> = {
  paidTraffic: { costUnit: 'cpc', unitCost: '1,50', conversions: ['10', '5'], budget: '3000', ticket: '500' },
  ecommerce: { costUnit: 'cpm', unitCost: '15', conversions: ['1,5', '8', '30'], budget: '5000', ticket: '150' },
  b2b: { costUnit: 'unit', unitCost: '80', conversions: ['40', '30', '20'], budget: '10000', ticket: '10000' },
}

/** A new funnel from a template: budget mode, no extra costs. "Blank" leaves the required fields empty. */
export function templateForm(id: TemplateId): FunnelForm {
  const base = { ...initialForm(), ticket: '' }
  if (id === 'blank') {
    const stages = [newStage(texts.panel.newStageName(1)), newStage(texts.panel.newStageName(2), '')]
    return { ...base, budget: '', costUnit: 'cpc', unitCost: '', stages }
  }
  const { conversions, ...values } = templates[id]
  // The first stage's conversion is hidden; it shows if the stage is moved down.
  const stages = texts.funnels.templateStages[id].map((name, i) => newStage(name, i === 0 ? '10' : conversions[i - 1]))
  return { ...base, ...values, stages }
}

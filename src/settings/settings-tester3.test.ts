import { comparisonRows } from '../compare/table'
import type { BudgetResult } from '../funnel/calc'
import { texts } from '../texts'

const t = texts.funnel.totals

const result = (over: Partial<BudgetResult>): BudgetResult =>
  ({
    media: 12345.678,
    extraCosts: 0,
    totalCost: 12345.678,
    revenue: 40000,
    roas: 3.2,
    roi: 1.2345,
    stages: [{ volume: 1234567, costPerResult: 0.01 }],
    ...over,
  }) as unknown as BudgetResult

test('tabela da comparação com ponto: dinheiro, volume, ROAS e ROI com ponto decimal e vírgula no milhar', () => {
  const rows = comparisonRows(['Cliques'], [result({}), null], 'dot')
  const row = (label: string) => rows.find((r) => r.label === label)!.values
  expect(row(texts.compare.volumeRow('Cliques'))).toEqual(['1,234,567', texts.funnel.noValue])
  expect(row(texts.compare.costRow('Cliques'))).toEqual(['R$ 0.01', texts.funnel.noValue])
  expect(row(t.media)).toEqual(['R$ 12,345.68', texts.funnel.noValue])
  expect(row(t.revenue)).toEqual(['R$ 40,000.00', texts.funnel.noValue])
  expect(row(t.roas)).toEqual(['3.20x', texts.funnel.noValue])
  expect(row(t.roi)).toEqual(['123.5%', texts.funnel.noValue])
})

test('tabela da comparação sem separador informado continua com vírgula', () => {
  const rows = comparisonRows(['Cliques'], [result({})])
  expect(rows.find((r) => r.label === t.media)!.values[0]).toBe('R$ 12.345,68')
})

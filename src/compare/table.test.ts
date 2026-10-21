import { calculateBudget } from '../funnel/calc'
import { texts } from '../texts'
import { bestOf, comparisonRows } from './table'

const c = texts.compare
const tt = texts.funnel.totals

describe('melhor valor', () => {
  test('o maior vence quando maior é melhor; o menor, quando menor é melhor', () => {
    expect(bestOf([10, 30, 20], 'higher')).toEqual([false, true, false])
    expect(bestOf([10, 30, 20], 'lower')).toEqual([true, false, false])
  })

  test('empatados ficam todos destacados', () => {
    expect(bestOf([30, 30, 20], 'higher')).toEqual([true, true, false])
  })

  test('uma linha toda igual fica sem destaque', () => {
    expect(bestOf([5, 5, 5], 'lower')).toEqual([false, false, false])
  })

  test('"—" não conta', () => {
    expect(bestOf([null, 10, 20], 'lower')).toEqual([false, true, false])
    expect(bestOf([null, 10], 'lower')).toEqual([false, false])
    expect(bestOf([null, null], 'higher')).toEqual([false, false])
  })
})

const input = (budget: number, conversion: number, ticket?: number) => ({
  budget,
  costUnit: 'cpc' as const,
  unitCost: 1,
  ticket,
  stages: [
    { conversion: 0, extraCost: 0 },
    { conversion, extraCost: 0 },
  ],
})

test('linhas: volume e custo por resultado de cada etapa, depois mídia, custo total, receita, ROAS e ROI', () => {
  const rows = comparisonRows(['Cliques', 'Vendas'], [calculateBudget(input(1000, 10, 50)), calculateBudget(input(1000, 20, 50))])
  expect(rows.map((r) => r.label)).toEqual([
    c.volumeRow('Cliques'),
    c.costRow('Cliques'),
    c.volumeRow('Vendas'),
    c.costRow('Vendas'),
    tt.media,
    tt.totalCost,
    tt.revenue,
    tt.roas,
    tt.roi,
  ])
  const vendas = rows[2]
  expect(vendas.values).toEqual(['100', '200'])
  expect(vendas.best).toEqual([false, true])
  // Same budget: the media row is all equal, so nothing stands out.
  expect(rows[4].values).toEqual(['R$ 1.000,00', 'R$ 1.000,00'])
  expect(rows[4].best).toEqual([false, false])
  expect(rows[3].best).toEqual([false, true])
  expect(rows[8].values).toEqual(['400,0%', '900,0%'])
})

test('funil inválido ou com meta impossível: "—" em todas as células, sem concorrer', () => {
  const rows = comparisonRows(['Cliques', 'Vendas'], [null, calculateBudget(input(1000, 10, 50))])
  expect(rows.every((r) => r.values[0] === texts.funnel.noValue)).toBe(true)
  expect(rows.every((r) => r.best[0] === false)).toBe(true)
})

test('valores que aparecem iguais na tela empatam', () => {
  const a = calculateBudget(input(1000, 10))
  const b = calculateBudget(input(1000.0000001, 10))
  const rows = comparisonRows(['Cliques', 'Vendas'], [a, b])
  expect(rows[4].best).toEqual([false, false])
})

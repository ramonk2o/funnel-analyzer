import { calculateBudget, type FunnelInput } from './calc'

function funnel(overrides: Partial<FunnelInput> = {}): FunnelInput {
  return {
    budget: 2000,
    costUnit: 'cpm',
    unitCost: 20,
    stages: [
      { conversion: 0, extraCost: 0 },
      { conversion: 2.5, extraCost: 0 },
      { conversion: 12, extraCost: 0 },
      { conversion: 15, extraCost: 0 },
    ],
    ...overrides,
  }
}

test('volume da primeira etapa em cada unidade de custo', () => {
  expect(calculateBudget(funnel({ costUnit: 'cpm', unitCost: 20 })).stages[0].volume).toBe(100000)
  expect(calculateBudget(funnel({ costUnit: 'cpc', unitCost: 0.8 })).stages[0].volume).toBe(2500)
  expect(calculateBudget(funnel({ costUnit: 'unit', unitCost: 4 })).stages[0].volume).toBe(500)
})

test('cada etapa seguinte é o volume anterior vezes a conversão, sem arredondar no caminho', () => {
  const result = calculateBudget(
    funnel({
      costUnit: 'unit',
      unitCost: 3,
      stages: [
        { conversion: 0, extraCost: 0 },
        { conversion: 33.3, extraCost: 0 },
        { conversion: 50, extraCost: 0 },
      ],
    }),
  )
  const first = 2000 / 3
  expect(result.stages[0].volume).toBeCloseTo(first, 10)
  expect(result.stages[1].volume).toBeCloseTo(first * 0.333, 10)
  expect(result.stages[2].volume).toBeCloseTo(first * 0.333 * 0.5, 10)
})

test('custos extras: volume vezes custo extra de cada etapa, somados à mídia no custo total', () => {
  const result = calculateBudget(
    funnel({
      stages: [
        { conversion: 0, extraCost: 0 },
        { conversion: 2.5, extraCost: 0 },
        { conversion: 12, extraCost: 2 }, // 300 leads × R$ 2
        { conversion: 15, extraCost: 50 }, // 45 vendas × R$ 50
      ],
    }),
  )
  expect(result.stages[2].extraCost).toBeCloseTo(600)
  expect(result.stages[3].extraCost).toBeCloseTo(2250)
  expect(result.media).toBe(2000)
  expect(result.extraCosts).toBeCloseTo(2850)
  expect(result.totalCost).toBeCloseTo(4850)
})

test('custo por resultado: custo acumulado até a etapa dividido pelo volume dela', () => {
  const result = calculateBudget(
    funnel({
      stages: [
        { conversion: 0, extraCost: 0 },
        { conversion: 2.5, extraCost: 0 },
        { conversion: 12, extraCost: 2 },
        { conversion: 15, extraCost: 50 },
      ],
    }),
  )
  expect(result.stages[1].costPerResult).toBeCloseTo(2000 / 2500)
  expect(result.stages[2].costPerResult).toBeCloseTo((2000 + 600) / 300)
  expect(result.stages[3].costPerResult).toBeCloseTo((2000 + 600 + 2250) / 45)
})

test('conversão 0% zera as etapas seguintes e deixa o custo por resultado sem valor', () => {
  const result = calculateBudget(
    funnel({
      stages: [
        { conversion: 0, extraCost: 0 },
        { conversion: 0, extraCost: 1 },
        { conversion: 50, extraCost: 0 },
      ],
    }),
  )
  expect(result.stages[1].volume).toBe(0)
  expect(result.stages[2].volume).toBe(0)
  expect(result.stages[1].costPerResult).toBeNull()
  expect(result.stages[2].costPerResult).toBeNull()
  expect(result.totalCost).toBe(2000)
})

test('verba zero dá volumes zero, sem quebrar', () => {
  const result = calculateBudget(funnel({ budget: 0 }))
  expect(result.stages.every((s) => s.volume === 0 && s.costPerResult === null)).toBe(true)
  expect(result.totalCost).toBe(0)
})

test('com ticket médio: receita, ROAS e ROI', () => {
  const result = calculateBudget(
    funnel({
      ticket: 200, // 45 vendas
      stages: [
        { conversion: 0, extraCost: 0 },
        { conversion: 2.5, extraCost: 0 },
        { conversion: 12, extraCost: 0 },
        { conversion: 15, extraCost: 20 }, // 900 de extras
      ],
    }),
  )
  expect(result.revenue).toBeCloseTo(9000)
  expect(result.roas).toBeCloseTo(9000 / 2000)
  expect(result.roi).toBeCloseTo((9000 - 2900) / 2900)
})

test('ROI pode ser negativo', () => {
  const result = calculateBudget(funnel({ ticket: 10 })) // 45 × 10 = 450 de receita
  expect(result.roi).toBeCloseTo((450 - 2000) / 2000)
})

test('sem ticket médio, não há receita, ROAS nem ROI', () => {
  const result = calculateBudget(funnel())
  expect(result.revenue).toBeNull()
  expect(result.roas).toBeNull()
  expect(result.roi).toBeNull()
})

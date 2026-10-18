import { calculateGoal, type GoalInput } from './calc'

// Floating-point noise allowed when checking that the goal is reached.
const EPS = 1e-9

function goal(overrides: Partial<GoalInput> = {}): GoalInput {
  return {
    costUnit: 'cpm',
    unitCost: 20,
    stages: [
      { conversion: 0, extraCost: 0 },
      { conversion: 2.5, extraCost: 0 },
      { conversion: 12, extraCost: 0 },
      { conversion: 15, extraCost: 0 },
    ],
    target: 3,
    goal: 45,
    ...overrides,
  }
}

test('meta numa etapa: o investimento faz a etapa atingir a meta', () => {
  const result = calculateGoal(goal())!
  expect(result.investment).toBe(2000) // o funil de exemplo dá 45 vendas com R$ 2.000
  expect(result.budget.stages[3].volume).toBeGreaterThanOrEqual(45 - EPS)
  expect(result.budget.stages[3].volume).toBeLessThan(45.001)
})

test('meta na 1ª etapa, em cada unidade de custo', () => {
  expect(calculateGoal(goal({ target: 0, goal: 100000, costUnit: 'cpm', unitCost: 20 }))!.investment).toBe(2000)
  expect(calculateGoal(goal({ target: 0, goal: 2500, costUnit: 'cpc', unitCost: 0.8 }))!.investment).toBe(2000)
  expect(calculateGoal(goal({ target: 0, goal: 500, costUnit: 'unit', unitCost: 4 }))!.investment).toBe(2000)
})

test('com custos extras, o investimento cobre mídia + extras, que somam exatamente o total', () => {
  const stages = [
    { conversion: 0, extraCost: 0 },
    { conversion: 2.5, extraCost: 0 },
    { conversion: 12, extraCost: 2 }, // R$ 2 por lead
    { conversion: 15, extraCost: 0 },
  ]
  const result = calculateGoal(goal({ stages }))!
  // 45 vendas pedem 300 leads (R$ 600 de extras) e R$ 2.000 de mídia.
  expect(result.investment).toBe(2600)
  expect(result.budget.media + result.budget.extraCosts).toBeCloseTo(2600, 9)
  expect(result.budget.totalCost).toBeCloseTo(result.investment, 9)
  expect(result.budget.stages[3].volume).toBeGreaterThanOrEqual(45 - EPS)
})

test('meta de receita usa o ticket médio', () => {
  const result = calculateGoal(goal({ target: 'revenue', goal: 9000, ticket: 200 }))!
  expect(result.investment).toBe(2000) // 9.000 ÷ 200 = 45 vendas
  expect(result.budget.revenue).toBeGreaterThanOrEqual(9000 - EPS)
})

test('o investimento é arredondado para cima no centavo', () => {
  // CPC R$ 1 e 1 clique: R$ 1,00 exato; 1,001 cliques pedem R$ 1,001 → R$ 1,01.
  const exact = calculateGoal(goal({ target: 0, goal: 1, costUnit: 'cpc', unitCost: 1 }))!
  expect(exact.investment).toBe(1)
  const fraction = calculateGoal(goal({ target: 0, goal: 1.001, costUnit: 'cpc', unitCost: 1 }))!
  expect(fraction.investment).toBe(1.01)
  expect(fraction.budget.stages[0].volume).toBeGreaterThanOrEqual(1.001 - EPS)
})

test('arredondar não sobe um centavo por erro de ponto flutuante', () => {
  // 0,1 + 0,2 em ponto flutuante dá 0,30000000000000004.
  const result = calculateGoal(
    goal({
      target: 0,
      goal: 1,
      costUnit: 'unit',
      unitCost: 0.1,
      stages: [{ conversion: 0, extraCost: 0.2 }],
    }),
  )!
  expect(result.investment).toBe(0.3)
})

test('meta impossível: conversão 0% antes da etapa-alvo', () => {
  const stages = [
    { conversion: 0, extraCost: 0 },
    { conversion: 0, extraCost: 0 },
    { conversion: 12, extraCost: 0 },
    { conversion: 15, extraCost: 0 },
  ]
  expect(calculateGoal(goal({ stages, target: 3 }))).toBeNull()
  expect(calculateGoal(goal({ stages, target: 1 }))).toBeNull()
})

test('conversão 0% depois da etapa-alvo não torna a meta impossível', () => {
  const stages = [
    { conversion: 0, extraCost: 0 },
    { conversion: 2.5, extraCost: 0 },
    { conversion: 0, extraCost: 0 },
    { conversion: 15, extraCost: 0 },
  ]
  expect(calculateGoal(goal({ stages, target: 1, goal: 2500 }))!.investment).toBe(2000)
})

test('meta de receita impossível sem ticket ou com ticket 0', () => {
  expect(calculateGoal(goal({ target: 'revenue', goal: 9000, ticket: undefined }))).toBeNull()
  expect(calculateGoal(goal({ target: 'revenue', goal: 9000, ticket: 0 }))).toBeNull()
})

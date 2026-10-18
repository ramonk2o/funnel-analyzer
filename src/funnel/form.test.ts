import { initialForm, readForm, type FunnelForm } from './form'

function form(overrides: Partial<FunnelForm> = {}): FunnelForm {
  return { ...initialForm(), ...overrides }
}

function withStage(index: number, changes: Partial<FunnelForm['stages'][number]>): FunnelForm {
  const base = initialForm()
  return { ...base, stages: base.stages.map((s, i) => (i === index ? { ...s, ...changes } : s)) }
}

test('o funil inicial é o exemplo e é válido', () => {
  const start = initialForm()
  expect(start.stages.map((s) => s.name)).toEqual(['Impressões', 'Cliques', 'Leads', 'Vendas'])
  const { input, invalid } = readForm(start)
  expect(invalid.size).toBe(0)
  expect(input).toMatchObject({ budget: 2000, costUnit: 'cpm', unitCost: 20, ticket: undefined })
  expect(input!.stages.map((s) => s.conversion).slice(1)).toEqual([2.5, 12, 15])
})

test('conversão fora de 0% a 100% é inválida', () => {
  for (const conversion of ['-1', '100,1', '150']) {
    const f = withStage(1, { conversion })
    const { input, invalid } = readForm(f)
    expect(input).toBeNull()
    expect(invalid.has(`${f.stages[1].id}.conversion`)).toBe(true)
  }
  for (const conversion of ['0', '100']) {
    expect(readForm(withStage(1, { conversion })).invalid.size).toBe(0)
  }
})

test('verba, custo extra e ticket negativos são inválidos; zero vale', () => {
  expect(readForm(form({ budget: '-1' })).invalid.has('budget')).toBe(true)
  expect(readForm(form({ ticket: '-1' })).invalid.has('ticket')).toBe(true)
  const f = withStage(2, { extraCost: '-1' })
  expect(readForm(f).invalid.has(`${f.stages[2].id}.extraCost`)).toBe(true)

  expect(readForm(form({ budget: '0', ticket: '0' })).invalid.size).toBe(0)
  expect(readForm(withStage(2, { extraCost: '0' })).invalid.size).toBe(0)
})

test('o custo de mídia da primeira etapa precisa ser maior que zero', () => {
  expect(readForm(form({ unitCost: '0' })).invalid.has('unitCost')).toBe(true)
  expect(readForm(form({ unitCost: '-2' })).invalid.has('unitCost')).toBe(true)
  expect(readForm(form({ unitCost: '0,01' })).invalid.size).toBe(0)
})

test('campo obrigatório vazio é inválido', () => {
  expect(readForm(form({ budget: '' })).invalid.has('budget')).toBe(true)
  expect(readForm(form({ unitCost: ' ' })).invalid.has('unitCost')).toBe(true)
  const f = withStage(3, { conversion: '' })
  expect(readForm(f).invalid.has(`${f.stages[3].id}.conversion`)).toBe(true)
})

test('custo extra e ticket vazios significam "não informado"', () => {
  const { input, invalid } = readForm(form({ ticket: '' }))
  expect(invalid.size).toBe(0)
  expect(input!.ticket).toBeUndefined()
  expect(input!.stages.every((s) => s.extraCost === 0)).toBe(true)
})

test('número com ponto é inválido', () => {
  expect(readForm(form({ budget: '2.000' })).invalid.has('budget')).toBe(true)
  expect(readForm(form({ unitCost: '0.8' })).invalid.has('unitCost')).toBe(true)
})

test('a conversão da primeira etapa não é usada nem validada', () => {
  expect(readForm(withStage(0, { conversion: 'xyz' })).invalid.size).toBe(0)
})

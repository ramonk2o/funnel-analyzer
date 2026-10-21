import { initialForm, readForm, setMode, type FunnelForm } from '../funnel/form'
import { comparedForm, followTarget, type CompareSettings } from './scenario'

const shared: CompareSettings = { mode: 'budget', shared: true, budget: '5000', goalTarget: 2, goal: '30' }

test('valor comum no modo orçamento: todos usam a mesma verba', () => {
  const form = comparedForm({ ...initialForm(), budget: '100' }, shared)
  expect(form.mode).toBe('budget')
  expect(form.budget).toBe('5000')
})

test('valor comum no modo meta: a mesma meta, na mesma posição', () => {
  const base = initialForm()
  const form = comparedForm(base, { ...shared, mode: 'goal' })
  expect(form.mode).toBe('goal')
  expect(form.goal).toBe('30')
  expect(form.goalTarget).toBe(base.stages[2].id)
  expect(comparedForm(base, { ...shared, mode: 'goal', goalTarget: 'revenue' }).goalTarget).toBe('revenue')
})

test('sem valor comum: cada funil usa a própria verba ou a própria meta', () => {
  const own: CompareSettings = { ...shared, shared: false }
  expect(comparedForm({ ...initialForm(), budget: '100' }, own).budget).toBe('100')

  let goalForm: FunnelForm = setMode(initialForm(), 'goal', 45)
  goalForm = { ...goalForm, goal: '12', goalTarget: goalForm.stages[1].id, mode: 'budget' }
  const form = comparedForm(goalForm, { ...own, mode: 'goal' })
  expect(form.mode).toBe('goal')
  expect([form.goal, form.goalTarget]).toEqual(['12', goalForm.stages[1].id])
})

test('sem valor comum, meta nunca definida: fica vazia, na última etapa, e conta como inválida', () => {
  const base = initialForm()
  const form = comparedForm(base, { ...shared, shared: false, mode: 'goal' })
  expect(form.goalTarget).toBe(base.stages[3].id)
  expect(form.goal).toBe('')
  expect(readForm(form).invalid.has('goal')).toBe(true)
})

describe('"Meta em" comum segue a etapa', () => {
  test('ao reordenar, acompanha a etapa', () => {
    expect(followTarget(3, { from: 3, to: 1 }, 4)).toBe(1)
    expect(followTarget(1, { from: 3, to: 1 }, 4)).toBe(2)
    expect(followTarget(0, { from: 3, to: 1 }, 4)).toBe(0)
  })

  test('ao remover uma etapa antes dela, acompanha; se a própria sai, vai para a última', () => {
    expect(followTarget(3, { removed: 1 }, 3)).toBe(2)
    expect(followTarget(1, { removed: 3 }, 3)).toBe(1)
    expect(followTarget(1, { removed: 1 }, 3)).toBe(2)
  })

  test('receita não muda', () => {
    expect(followTarget('revenue', { removed: 0 }, 3)).toBe('revenue')
  })
})

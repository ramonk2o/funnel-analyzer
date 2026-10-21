import { initialForm, setMode, updateStage, type FunnelForm } from '../funnel/form'
import { addStageToAll, moveStageInAll, removeStageFromAll, renameStageInAll } from './structure'

// Two scenarios of the same funnel, with different numbers.
function pair(): FunnelForm[] {
  const a = initialForm()
  let b = updateStage(initialForm(), initialForm().stages[0].id, {})
  b = { ...b, budget: '9000', stages: b.stages.map((s, i) => ({ ...s, conversion: String(50 + i), extraCost: String(i) })) }
  return [a, b]
}
const names = (f: FunnelForm) => f.stages.map((s) => s.name)
const numbers = (f: FunnelForm) => f.stages.map((s) => [s.conversion, s.extraCost])

test('adicionar: a mesma etapa nova no fim de todos, com 10% em cada um', () => {
  const [a, b] = addStageToAll(pair())
  expect(names(a)).toEqual(['Impressões', 'Cliques', 'Leads', 'Vendas', 'Etapa 5'])
  expect(names(b)).toEqual(names(a))
  expect(a.stages[4].conversion).toBe('10')
  expect(b.stages[4].conversion).toBe('10')
  expect(numbers(b).slice(0, 4)).toEqual(numbers(pair()[1]))
})

test('remover: a mesma posição em todos', () => {
  const [a, b] = removeStageFromAll(pair(), 1)
  expect(names(a)).toEqual(['Impressões', 'Leads', 'Vendas'])
  expect(names(b)).toEqual(['Impressões', 'Leads', 'Vendas'])
  expect(numbers(b)).toEqual([['50', '0'], ['52', '2'], ['53', '3']])
})

test('reordenar: cada etapa leva os próprios números, e a meta segue a etapa', () => {
  const forms = pair()
  forms[1] = { ...setMode(forms[1], 'goal', 10), goalTarget: forms[1].stages[3].id }
  const [a, b] = moveStageInAll(forms, 3, 1)
  expect(names(a)).toEqual(['Impressões', 'Vendas', 'Cliques', 'Leads'])
  expect(names(b)).toEqual(names(a))
  expect(numbers(b)).toEqual([['50', '0'], ['53', '3'], ['51', '1'], ['52', '2']])
  expect(b.goalTarget).toBe(b.stages[1].id)
})

test('renomear: o mesmo nome em todos, sem mudar os números', () => {
  const [a, b] = renameStageInAll(pair(), 2, 'Contatos')
  expect(names(a)[2]).toBe('Contatos')
  expect(names(b)[2]).toBe('Contatos')
  expect(numbers(b)).toEqual(numbers(pair()[1]))
})

test('remover respeita o mínimo de 2 etapas, e adicionar o máximo de 10', () => {
  const two = pair().map((f) => ({ ...f, stages: f.stages.slice(0, 2) }))
  expect(removeStageFromAll(two, 0).map((f) => f.stages.length)).toEqual([2, 2])
  let ten = pair()
  for (let i = 0; i < 6; i++) ten = addStageToAll(ten)
  expect(addStageToAll(ten).map((f) => f.stages.length)).toEqual([10, 10])
})

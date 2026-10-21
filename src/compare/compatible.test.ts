import { initialForm, updateStage, type FunnelForm } from '../funnel/form'
import { incompatibility } from './compatible'

const rename = (form: FunnelForm, i: number, name: string) => updateStage(form, form.stages[i].id, { name })

test('mesma quantidade e mesmos nomes na mesma ordem são compatíveis', () => {
  expect(incompatibility(initialForm(), initialForm())).toBeNull()
})

test('não diferencia maiúsculas nem espaços sobrando', () => {
  expect(incompatibility(initialForm(), rename(initialForm(), 2, '  LEADS '))).toBeNull()
})

test('a unidade de custo da 1ª etapa e os números podem ser diferentes', () => {
  const other = { ...updateStage(initialForm(), initialForm().stages[1].id, { conversion: '50' }) }
  expect(incompatibility(initialForm(), { ...other, costUnit: 'cpc', unitCost: '1', budget: '9' })).toBeNull()
})

test('outra quantidade de etapas não é compatível', () => {
  const form = initialForm()
  const fewer = { ...form, stages: form.stages.slice(0, 3) }
  expect(incompatibility(form, fewer)).toBe('count')
})

test('outro nome ou outra ordem não é compatível', () => {
  const form = initialForm()
  expect(incompatibility(form, rename(form, 1, 'Visitas'))).toBe('names')
  expect(incompatibility(form, { ...form, stages: [...form.stages].reverse() })).toBe('names')
})

test('etapa sem nome só bate com outra sem nome na mesma posição', () => {
  const blank = rename(initialForm(), 1, '')
  expect(incompatibility(blank, rename(initialForm(), 1, '  '))).toBeNull()
  expect(incompatibility(blank, rename(initialForm(), 1, 'Etapa 2'))).toBe('names')
})

test('espaços repetidos no meio contam como um só; nome só com espaços conta como vazio', () => {
  expect(incompatibility(rename(initialForm(), 1, 'Lead Qualificado'), rename(initialForm(), 1, 'Lead   Qualificado'))).toBeNull()
  expect(incompatibility(rename(initialForm(), 1, ''), rename(initialForm(), 1, '   '))).toBeNull()
})

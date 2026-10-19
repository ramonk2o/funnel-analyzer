import { texts } from '../texts'
import { templateForm } from './templates'

const tm = texts.funnels.templates

// What each stage shows in the panel, without the internal ids.
function stages(id: Parameters<typeof templateForm>[0]) {
  return templateForm(id).stages.slice(1).map((s) => [s.name, s.conversion])
}

test('todo modelo começa no modo orçamento e sem custos extras', () => {
  for (const id of ['blank', 'paidTraffic', 'ecommerce', 'b2b'] as const) {
    const form = templateForm(id)
    expect(form.mode).toBe('budget')
    expect(form.stages.every((s) => s.extraCost === '')).toBe(true)
  }
})

test('em branco: "Etapa 1" e "Etapa 2", CPC e os campos obrigatórios vazios', () => {
  const form = templateForm('blank')
  expect(form.stages.map((s) => s.name)).toEqual(['Etapa 1', 'Etapa 2'])
  expect(form.costUnit).toBe('cpc')
  expect(form.unitCost).toBe('')
  expect(form.budget).toBe('')
  expect(form.stages[1].conversion).toBe('')
  expect(form.ticket).toBe('')
})

test('Tráfego pago → Lead → Venda', () => {
  const form = templateForm('paidTraffic')
  expect(form.stages[0].name).toBe('Cliques')
  expect([form.costUnit, form.unitCost]).toEqual(['cpc', '1,50'])
  expect(stages('paidTraffic')).toEqual([['Leads', '10'], ['Vendas', '5']])
  expect([form.budget, form.ticket]).toEqual(['3000', '500'])
  expect(tm.paidTraffic).toBe('Tráfego pago → Lead → Venda')
})

test('E-commerce', () => {
  const form = templateForm('ecommerce')
  expect(form.stages[0].name).toBe('Impressões')
  expect([form.costUnit, form.unitCost]).toEqual(['cpm', '15'])
  expect(stages('ecommerce')).toEqual([['Cliques', '1,5'], ['Carrinho', '8'], ['Compra', '30']])
  expect([form.budget, form.ticket]).toEqual(['5000', '150'])
})

test('B2B', () => {
  const form = templateForm('b2b')
  expect(form.stages[0].name).toBe('Leads')
  expect([form.costUnit, form.unitCost]).toEqual(['unit', '80'])
  expect(stages('b2b')).toEqual([['MQL', '40'], ['SQL', '30'], ['Venda', '20']])
  expect([form.budget, form.ticket]).toEqual(['10000', '10000'])
})

test('cada funil criado de um modelo tem etapas próprias', () => {
  const a = templateForm('b2b')
  const b = templateForm('b2b')
  expect(a.stages.map((s) => s.id)).not.toEqual(b.stages.map((s) => s.id))
})

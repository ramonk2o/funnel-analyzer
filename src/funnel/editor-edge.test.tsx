// Extra tests written by the independent tester.
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { texts } from '../texts'
import { readForm, initialForm } from './form'

const t = texts.panel

// Opens the stage first (the stages are an accordion), so its fields can be reached.
function stage(n: number) {
  const panel = screen.getByRole('complementary', { name: t.label })
  const group = within(panel).getByRole('group', { name: t.stageGroup(n) })
  const toggle = group.querySelector('[aria-expanded="false"]')
  if (toggle) fireEvent.click(toggle)
  return group
}
function stageCount() {
  const panel = screen.getByRole('complementary', { name: t.label })
  return within(panel).getAllByRole('group').length
}
function bands() {
  return within(screen.getByRole('list', { name: texts.funnel.listLabel })).getAllByRole('listitem')
}
const bandPart = (part: string) => bands().map((b) => b.querySelector(`.funnel-band-${part}`)?.textContent ?? null)
const bandNames = () => bandPart('name')
const volumes = () => bandPart('volume')
const costs = () => bandPart('cost')
function total(label: string) {
  const totals = screen.getByLabelText(texts.funnel.totals.label)
  const term = within(totals).queryByText(label)
  return term ? term.nextElementSibling!.textContent : null
}
async function replace(input: HTMLElement, value: string) {
  const user = userEvent.setup()
  await user.clear(input)
  if (value) {
    await user.click(input)
    await user.paste(value)
  }
}

test('ticket inválido fica marcado e o funil mantém o último cálculo', async () => {
  render(<App />)
  const ticket = within(stage(4)).getByLabelText(t.ticket)
  await replace(ticket, '200')
  expect(total(texts.funnel.totals.revenue)).toBe('R$ 9.000,00')
  // Replace in one change, without passing through empty (empty ticket is valid).
  fireEvent.change(ticket, { target: { value: '2.00' } })
  expect(ticket).toHaveAttribute('aria-invalid', 'true')
  expect(total(texts.funnel.totals.revenue)).toBe('R$ 9.000,00')
})

test('custo extra inválido fica marcado; vazio volta a ser "não informado"', async () => {
  render(<App />)
  const extra = within(stage(3)).getByLabelText(t.extraCost)
  await replace(extra, 'abc')
  expect(extra).toHaveAttribute('aria-invalid', 'true')
  expect(total(texts.funnel.totals.extraCosts)).toBe('R$ 0,00')
  await replace(extra, '')
  expect(extra).not.toHaveAttribute('aria-invalid')
  expect(total(texts.funnel.totals.extraCosts)).toBe('R$ 0,00')
})

test('custo de mídia 0 fica inválido na tela e o funil não mostra volume infinito', async () => {
  render(<App />)
  const unitCost = within(stage(1)).getByLabelText(t.unitCost)
  await replace(unitCost, '0')
  expect(unitCost).toHaveAttribute('aria-invalid', 'true')
  expect(volumes()[0]).toBe('100.000')
})

test('verba vazia fica inválida na tela', async () => {
  render(<App />)
  const budget = screen.getByLabelText(t.budget)
  await replace(budget, '')
  expect(budget).toHaveAttribute('aria-invalid', 'true')
  expect(volumes()[0]).toBe('100.000')
})

test('remover a etapa com campo inválido volta a calcular', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(within(stage(3)).getByLabelText(t.conversion), '150')
  await replace(screen.getByLabelText(t.budget), '4000')
  expect(volumes()[0]).toBe('100.000')
  await user.click(within(stage(3)).getByRole('button', { name: t.remove }))
  await user.click(within(stage(3)).getByRole('button', { name: t.yes }))
  expect(bandNames()).toEqual(['Impressões', 'Cliques', 'Vendas'])
  expect(volumes()[0]).toBe('200.000')
})

test('ROI negativo aparece na tela com sinal', async () => {
  render(<App />)
  await replace(within(stage(4)).getByLabelText(t.ticket), '10') // 45 × 10 = 450
  expect(total(texts.funnel.totals.roi)).toBe('-77,5%')
  expect(total(texts.funnel.totals.roas)).toBe('0,23x')
})

test('ticket médio passa para a nova última etapa ao adicionar e a receita usa o volume dela', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(within(stage(4)).getByLabelText(t.ticket), '200')
  await user.click(screen.getByRole('button', { name: t.addStage }))
  expect(within(stage(4)).queryByLabelText(t.ticket)).toBeNull()
  expect(within(stage(5)).getByLabelText(t.ticket)).toHaveValue('200')
  // 45 × 10% = 4,5 vendas × R$ 200
  expect(total(texts.funnel.totals.revenue)).toBe('R$ 900,00')
})

test('custo extra de uma etapa continua com ela ao reordenar', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(within(stage(3)).getByLabelText(t.extraCost), '2')
  await user.click(within(stage(3)).getByRole('button', { name: t.moveDown }))
  expect(within(stage(4)).getByLabelText(t.name)).toHaveValue('Leads')
  expect(within(stage(4)).getByLabelText(t.extraCost)).toHaveValue('2')
})

test('volumes fracionários: o cálculo segue com casas completas e a tela arredonda', async () => {
  render(<App />)
  await replace(within(stage(4)).getByLabelText(t.conversion), '15,5') // 300 × 15,5% = 46,5
  expect(volumes()[3]).toBe('47')
  expect(costs()[3]).toBe('R$ 43,01 por resultado') // 2000 / 46,5
  expect(bands()[3]).toHaveTextContent('15,5%')
})

test('mover a primeira etapa para baixo: o funil acompanha a nova ordem', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(within(stage(1)).getByRole('button', { name: t.moveDown }))
  expect(within(stage(1)).getByLabelText(t.name)).toHaveValue('Cliques')
  // Impressões was the first stage, so its conversion was never shown or filled in.
  expect(bandNames()).toEqual(['Cliques', 'Impressões', 'Leads', 'Vendas'])
  // Nunca teve conversão: entra com 10%.
  expect(within(stage(2)).getByLabelText(t.conversion)).toHaveValue('10')
  expect(bands()[1]).toHaveTextContent('10%')
})

test('com 2 etapas, nenhuma etapa oferece remover (nem uma confirmação já aberta)', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(within(stage(4)).getByRole('button', { name: t.remove }))
  await user.click(within(stage(4)).getByRole('button', { name: t.yes }))
  // 3 etapas: abre a confirmação nas duas últimas
  await user.click(within(stage(2)).getByRole('button', { name: t.remove }))
  await user.click(within(stage(3)).getByRole('button', { name: t.remove }))
  await user.click(within(stage(3)).getByRole('button', { name: t.yes }))
  expect(stageCount()).toBe(2)
  expect(within(stage(2)).queryByRole('button', { name: t.yes })).toBeNull()
  expect(within(stage(2)).getByRole('button', { name: t.remove })).toBeDisabled()
})

test('nome de etapa nova após remover: não repete um nome existente', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: t.addStage })) // Etapa 5
  await user.click(within(stage(2)).getByRole('button', { name: t.remove }))
  await user.click(within(stage(2)).getByRole('button', { name: t.yes }))
  await user.click(screen.getByRole('button', { name: t.addStage }))
  const names = bandNames()
  expect(new Set(names).size).toBe(names.length)
  expect(names[4]).toBe(t.newStageName(6))
})

test('conversões com vírgula nos limites são válidas', () => {
  const base = initialForm()
  for (const conversion of ['100,0', '0,5', '99,99']) {
    const f = { ...base, stages: base.stages.map((s, i) => (i === 1 ? { ...s, conversion } : s)) }
    expect(readForm(f).invalid.size).toBe(0)
  }
})

test('valores muito grandes não quebram a tela', async () => {
  render(<App />)
  await replace(screen.getByLabelText(t.budget), '999999999999')
  expect(volumes()[0]).toBe('49.999.999.999.950')
  expect(total(texts.funnel.totals.media)).toBe('R$ 999.999.999.999,00')
})

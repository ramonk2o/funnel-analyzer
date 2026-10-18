// Extra tests written by the independent tester (second round).
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { texts } from '../texts'
import { parseDecimal } from './numbers'

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
const add = () => userEvent.setup().click(screen.getByRole('button', { name: t.addStage }))
async function removeStageAt(n: number) {
  const user = userEvent.setup()
  await user.click(within(stage(n)).getByRole('button', { name: t.remove }))
  await user.click(within(stage(n)).getByRole('button', { name: t.yes }))
}

test('etapa que volta a sair do 1º lugar mostra a conversão que tinha antes', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(within(stage(2)).getByRole('button', { name: t.moveUp })) // Cliques sobe
  expect(within(stage(1)).getByLabelText(t.name)).toHaveValue('Cliques')
  expect(within(stage(1)).queryByLabelText(t.conversion)).toBeNull()
  await user.click(within(stage(1)).getByRole('button', { name: t.moveDown })) // volta
  expect(within(stage(2)).getByLabelText(t.conversion)).toHaveValue('2,5')
  expect(bands()[1]).toHaveTextContent('2,5%')
  expect(volumes()).toEqual(['100.000', '2.500', '300', '45'])
})

test('custo de mídia e unidade ficam com a 1ª posição ao reordenar', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.selectOptions(within(stage(1)).getByLabelText(t.costUnit), t.costUnits.cpc)
  await replace(within(stage(1)).getByLabelText(t.unitCost), '2')
  await user.click(within(stage(2)).getByRole('button', { name: t.moveUp }))
  expect(within(stage(1)).getByLabelText(t.name)).toHaveValue('Cliques')
  expect(within(stage(1)).getByLabelText(t.costUnit)).toHaveValue('cpc')
  expect(within(stage(1)).getByLabelText(t.unitCost)).toHaveValue('2')
  expect(within(stage(2)).queryByLabelText(t.unitCost)).toBeNull()
  expect(costs()[0]).toBe('R$ 2,00 CPC')
  expect(volumes()[0]).toBe('1.000') // 2000 ÷ 2
  expect(volumes()[1]).toBe('100') // Impressões, 10%
})

test('remover a 1ª etapa: a nova 1ª herda custo de mídia e unidade', async () => {
  render(<App />)
  await removeStageAt(1)
  expect(bandNames()).toEqual(['Cliques', 'Leads', 'Vendas'])
  expect(costs()[0]).toBe('R$ 20,00 CPM')
  expect(volumes()).toEqual(['100.000', '12.000', '1.800'])
})

test('ticket médio fica sempre na última etapa ao reordenar e remover', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(within(stage(4)).getByLabelText(t.ticket), '200')
  await user.click(within(stage(4)).getByRole('button', { name: t.moveUp }))
  expect(within(stage(3)).queryByLabelText(t.ticket)).toBeNull()
  expect(within(stage(4)).getByLabelText(t.ticket)).toHaveValue('200')
  expect(within(stage(4)).getByLabelText(t.name)).toHaveValue('Leads')
  // Agora a última é Leads: 2000/20*1000*2,5%*15%*12% = 45 → ainda 45 (mesma multiplicação)
  expect(total(texts.funnel.totals.revenue)).toBe('R$ 9.000,00')
  await removeStageAt(4)
  expect(within(stage(3)).getByLabelText(t.ticket)).toHaveValue('200')
  expect(total(texts.funnel.totals.revenue)).toBe('R$ 75.000,00') // 375 vendas × 200
})

test('com ticket e verba 0: ROAS "—", custo por resultado "—"', async () => {
  render(<App />)
  await replace(within(stage(4)).getByLabelText(t.ticket), '200')
  await replace(screen.getByLabelText(t.budget), '0')
  expect(screen.getByLabelText(t.budget)).not.toHaveAttribute('aria-invalid')
  expect(volumes()).toEqual(['0', '0', '0', '0'])
  expect(costs().slice(1)).toEqual([texts.funnel.noValue, texts.funnel.noValue, texts.funnel.noValue])
  expect(total(texts.funnel.totals.revenue)).toBe('R$ 0,00')
  expect(total(texts.funnel.totals.roas)).toBe(texts.funnel.noValue)
})

test('conversão 0% na tela: etapas seguintes com volume 0 e custo "—"', async () => {
  render(<App />)
  await replace(within(stage(2)).getByLabelText(t.conversion), '0')
  expect(volumes()).toEqual(['100.000', '0', '0', '0'])
  expect(costs()[1]).toBe(texts.funnel.noValue)
  expect(costs()[3]).toBe(texts.funnel.noValue)
})

test('ROI usa o custo total (com custos extras) e ROAS só a mídia', async () => {
  render(<App />)
  await replace(within(stage(4)).getByLabelText(t.ticket), '100') // receita 4500
  await replace(within(stage(4)).getByLabelText(t.extraCost), '20') // 45 × 20 = 900
  expect(total(texts.funnel.totals.totalCost)).toBe('R$ 2.900,00')
  expect(total(texts.funnel.totals.roas)).toBe('2,25x')
  expect(total(texts.funnel.totals.roi)).toBe('55,2%') // 1600 / 2900
})

test('custo extra na 1ª etapa entra no custo por resultado de todas as seguintes', async () => {
  render(<App />)
  await replace(within(stage(1)).getByLabelText(t.extraCost), '0,01') // 100.000 × 0,01 = 1000
  expect(total(texts.funnel.totals.extraCosts)).toBe('R$ 1.000,00')
  expect(costs()[0]).toBe('R$ 20,00 CPM')
  expect(costs()[1]).toBe('R$ 1,20 por resultado') // 3000 / 2500
})

test('nome "Etapa N" já usado: etapa nova pega o próximo número livre', async () => {
  render(<App />)
  await replace(within(stage(2)).getByLabelText(t.name), 'Etapa 5')
  await replace(within(stage(3)).getByLabelText(t.name), 'Etapa 6')
  await add()
  expect(within(stage(5)).getByLabelText(t.name)).toHaveValue('Etapa 7')
})

test('nome livre menor que N não é usado: começa em quantidade + 1', async () => {
  render(<App />)
  await add()
  expect(within(stage(5)).getByLabelText(t.name)).toHaveValue('Etapa 5')
  await removeStageAt(5)
  await removeStageAt(4)
  await add() // 3 etapas → "Etapa 4"
  expect(within(stage(4)).getByLabelText(t.name)).toHaveValue('Etapa 4')
})

test('com 10 etapas, remover uma reabilita adicionar', async () => {
  render(<App />)
  for (let i = 0; i < 6; i++) await add()
  expect(stageCount()).toBe(10)
  expect(screen.getByRole('button', { name: t.addStage })).toBeDisabled()
  await removeStageAt(10)
  expect(screen.getByRole('button', { name: t.addStage })).toBeEnabled()
})

test('confirmação fechada sozinha ao cair para 2 não reaparece ao adicionar', async () => {
  const user = userEvent.setup()
  render(<App />)
  await removeStageAt(4)
  await user.click(within(stage(2)).getByRole('button', { name: t.remove }))
  await user.click(within(stage(3)).getByRole('button', { name: t.remove }))
  await user.click(within(stage(3)).getByRole('button', { name: t.yes }))
  expect(screen.queryByText(t.confirmRemove)).toBeNull()
  await add()
  expect(stageCount()).toBe(3)
  expect(screen.queryByText(t.confirmRemove)).toBeNull()
})

test('confirmação aberta continua aberta enquanto houver mais de 2 etapas', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(within(stage(2)).getByRole('button', { name: t.remove }))
  await removeStageAt(4)
  expect(stageCount()).toBe(3)
  expect(within(stage(2)).getByText(t.confirmRemove)).toBeInTheDocument()
})

test('espaços nas pontas são ignorados na tela', async () => {
  render(<App />)
  const budget = screen.getByLabelText(t.budget)
  await replace(budget, '  1000,5 ')
  expect(budget).not.toHaveAttribute('aria-invalid')
  expect(total(texts.funnel.totals.media)).toBe('R$ 1.000,50')
})

test('conversão ",5" e "100," são válidas na tela', async () => {
  render(<App />)
  const conv = within(stage(2)).getByLabelText(t.conversion)
  await replace(conv, ',5')
  expect(conv).not.toHaveAttribute('aria-invalid')
  expect(volumes()[1]).toBe('500')
  await replace(conv, '100,')
  expect(conv).not.toHaveAttribute('aria-invalid')
  expect(volumes()[1]).toBe('100.000')
})

test('formatos inválidos de número', () => {
  for (const s of [',', '1,2,3', '1 000', '1.000,50', '-1', '+1', '1e3', '١٢', 'Infinity', 'NaN', '0x10']) {
    expect(parseDecimal(s)).toBeNull()
  }
})

// ASSUMPTION (not decided by the entry): while a field is invalid, the funnel also keeps
// the old names and stage list, not only the old numbers.

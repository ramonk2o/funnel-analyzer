import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { texts } from '../texts'

const t = texts.panel

function stage(n: number) {
  const panel = screen.getByRole('complementary', { name: t.label })
  return within(panel).getByRole('group', { name: t.stageGroup(n) })
}

function stageCount() {
  const panel = screen.getByRole('complementary', { name: t.label })
  return within(panel).getAllByRole('group').length
}

function bands() {
  return within(screen.getByRole('list', { name: texts.funnel.listLabel })).getAllByRole('listitem')
}

function bandPart(part: string) {
  return bands().map((b) => b.querySelector(`.funnel-band-${part}`)?.textContent ?? null)
}

const bandNames = () => bandPart('name')
const volumes = () => bandPart('volume')
const costs = () => bandPart('cost')

function total(label: string) {
  const totals = screen.getByLabelText(texts.funnel.totals.label)
  const term = within(totals).queryByText(label)
  return term ? term.nextElementSibling!.textContent : null
}

function budgetInput() {
  return screen.getByLabelText(t.budget)
}

async function replace(input: HTMLElement, value: string) {
  const user = userEvent.setup()
  await user.clear(input)
  if (value) await user.type(input, value)
}

test('abre com o funil de exemplo editável e calculado a partir da verba', () => {
  render(<App />)
  expect(budgetInput()).toHaveValue('2000')
  expect(stageCount()).toBe(4)
  expect(screen.queryByText('Exemplo')).toBeNull()

  expect(bandNames()).toEqual(['Impressões', 'Cliques', 'Leads', 'Vendas'])
  expect(volumes()).toEqual(['100.000', '2.500', '300', '45'])
  expect(costs()).toEqual([
    'R$ 20,00 CPM',
    'R$ 0,80 por resultado',
    'R$ 6,67 por resultado',
    'R$ 44,44 por resultado',
  ])
  expect(bands()[1]).toHaveTextContent('2,5%')
  expect(bands()[2]).toHaveTextContent('12%')
  expect(bands()[3]).toHaveTextContent('15%')
})

test('mostra mídia, custos extras e custo total separados', () => {
  render(<App />)
  expect(total(texts.funnel.totals.media)).toBe('R$ 2.000,00')
  expect(total(texts.funnel.totals.extraCosts)).toBe('R$ 0,00')
  expect(total(texts.funnel.totals.totalCost)).toBe('R$ 2.000,00')
})

test('recalcula a cada tecla', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.clear(budgetInput())
  await user.type(budgetInput(), '1')
  expect(volumes()[0]).toBe('50') // R$ 1 a CPM R$ 20
  await user.type(budgetInput(), '0')
  expect(volumes()[0]).toBe('500')
  await user.type(budgetInput(), '000')
  expect(volumes()[0]).toBe('500.000')
  expect(total(texts.funnel.totals.media)).toBe('R$ 10.000,00')
})

test('mudar custo de mídia ou conversão atualiza o funil', async () => {
  render(<App />)
  await replace(within(stage(1)).getByLabelText(t.unitCost), '10')
  expect(volumes()[0]).toBe('200.000')
  expect(costs()[0]).toBe('R$ 10,00 CPM')

  await replace(within(stage(2)).getByLabelText(t.conversion), '5')
  expect(bands()[1]).toHaveTextContent('5%')
  expect(volumes()[1]).toBe('10.000')
})

test('trocar a unidade de custo da primeira etapa recalcula o volume', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.selectOptions(within(stage(1)).getByLabelText(t.costUnit), t.costUnits.cpc)
  expect(volumes()[0]).toBe('100') // R$ 2.000 ÷ R$ 20
  expect(costs()[0]).toBe('R$ 20,00 CPC')

  await user.selectOptions(within(stage(1)).getByLabelText(t.costUnit), t.costUnits.unit)
  expect(volumes()[0]).toBe('100')
  expect(costs()[0]).toBe('R$ 20,00 por unidade')
})

test('custo extra entra nos custos extras, no custo total e no custo por resultado', async () => {
  render(<App />)
  await replace(within(stage(3)).getByLabelText(t.extraCost), '2') // 300 leads × R$ 2
  expect(total(texts.funnel.totals.extraCosts)).toBe('R$ 600,00')
  expect(total(texts.funnel.totals.totalCost)).toBe('R$ 2.600,00')
  expect(costs()[2]).toBe('R$ 8,67 por resultado')
})

test('receita, ROAS e ROI só aparecem com ticket médio', async () => {
  render(<App />)
  expect(total(texts.funnel.totals.revenue)).toBeNull()
  expect(total(texts.funnel.totals.roas)).toBeNull()
  expect(total(texts.funnel.totals.roi)).toBeNull()
  expect(within(stage(1)).queryByLabelText(t.ticket)).toBeNull()

  await replace(within(stage(4)).getByLabelText(t.ticket), '200') // 45 vendas
  expect(total(texts.funnel.totals.revenue)).toBe('R$ 9.000,00')
  expect(total(texts.funnel.totals.roas)).toBe('4,50x')
  expect(total(texts.funnel.totals.roi)).toBe('350,0%')

  await replace(within(stage(4)).getByLabelText(t.ticket), '')
  expect(total(texts.funnel.totals.revenue)).toBeNull()
})

test('renomear uma etapa muda o nome no funil', async () => {
  render(<App />)
  await replace(within(stage(2)).getByLabelText(t.name), 'Visitas')
  expect(bandNames()[1]).toBe('Visitas')
})

test('adicionar etapa: entra no fim como "Etapa N" com 10%, até 10 etapas', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: t.addStage }))

  expect(stageCount()).toBe(5)
  expect(within(stage(5)).getByLabelText(t.name)).toHaveValue(t.newStageName(5))
  expect(within(stage(5)).getByLabelText(t.conversion)).toHaveValue('10')
  expect(bandNames()[4]).toBe(t.newStageName(5))
  expect(bands()[4]).toHaveTextContent('10%')

  for (let i = 0; i < 5; i++) await user.click(screen.getByRole('button', { name: t.addStage }))
  expect(stageCount()).toBe(10)
  expect(screen.getByRole('button', { name: t.addStage })).toBeDisabled()
})

test('remover pede confirmação na própria etapa: Não cancela, Sim remove', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(within(stage(2)).getByRole('button', { name: t.remove }))
  expect(within(stage(2)).getByText(t.confirmRemove)).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).toBeNull()

  await user.click(within(stage(2)).getByRole('button', { name: t.no }))
  expect(stageCount()).toBe(4)
  expect(within(stage(2)).queryByText(t.confirmRemove)).toBeNull()

  await user.click(within(stage(2)).getByRole('button', { name: t.remove }))
  await user.click(within(stage(2)).getByRole('button', { name: t.yes }))
  expect(stageCount()).toBe(3)
  expect(bandNames()).toEqual(['Impressões', 'Leads', 'Vendas'])
})

test('com 2 etapas, remover fica desabilitado', async () => {
  const user = userEvent.setup()
  render(<App />)
  for (let i = 0; i < 2; i++) {
    await user.click(within(stage(2)).getByRole('button', { name: t.remove }))
    await user.click(within(stage(2)).getByRole('button', { name: t.yes }))
  }
  expect(stageCount()).toBe(2)
  for (const n of [1, 2]) {
    expect(within(stage(n)).getByRole('button', { name: t.remove })).toBeDisabled()
  }
})

test('as setas mudam a ordem no painel e no funil', async () => {
  const user = userEvent.setup()
  render(<App />)
  expect(within(stage(1)).getByRole('button', { name: t.moveUp })).toBeDisabled()
  expect(within(stage(4)).getByRole('button', { name: t.moveDown })).toBeDisabled()

  await user.click(within(stage(2)).getByRole('button', { name: t.moveDown }))
  expect(within(stage(3)).getByLabelText(t.name)).toHaveValue('Cliques')
  expect(bandNames()).toEqual(['Impressões', 'Leads', 'Cliques', 'Vendas'])

  await user.click(within(stage(4)).getByRole('button', { name: t.moveUp }))
  expect(bandNames()).toEqual(['Impressões', 'Leads', 'Vendas', 'Cliques'])
})

test('campo inválido fica marcado e o funil mantém o último cálculo válido', async () => {
  render(<App />)
  const user = userEvent.setup()
  const conversion = within(stage(2)).getByLabelText(t.conversion)
  // Colado de uma vez: digitando, o "15" no caminho já seria um cálculo válido.
  await user.clear(conversion)
  await user.click(conversion)
  await user.paste('150')
  expect(conversion).toHaveAttribute('aria-invalid', 'true')
  expect(volumes()[1]).toBe('2.500')

  // Enquanto há campo inválido, outras mudanças não recalculam.
  await replace(budgetInput(), '4000')
  expect(volumes()[0]).toBe('100.000')

  await replace(conversion, '5')
  expect(conversion).not.toHaveAttribute('aria-invalid', 'true')
  expect(volumes()[0]).toBe('200.000')
  expect(volumes()[1]).toBe('10.000')
})

test('verba com ponto fica inválida', async () => {
  render(<App />)
  await replace(budgetInput(), '2.000')
  expect(budgetInput()).toHaveAttribute('aria-invalid', 'true')
})

test('nome vazio: a faixa mostra "Etapa N (sem nome definido)"', async () => {
  render(<App />)
  await replace(within(stage(3)).getByLabelText(t.name), '')
  expect(bandNames()[2]).toBe(texts.funnel.unnamedStage(3))
  expect(bandNames()[2]).toBe('Etapa 3 (sem nome definido)')
})

test('ROI com custo total 0 aparece como "—"', async () => {
  render(<App />)
  await replace(within(stage(4)).getByLabelText(t.ticket), '100')
  await replace(budgetInput(), '0')
  expect(total(texts.funnel.totals.roas)).toBe(texts.funnel.noValue)
  expect(total(texts.funnel.totals.roi)).toBe(texts.funnel.noValue)
})

test('com campo inválido, renomear e adicionar etapa só aparecem no funil quando tudo fica válido', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(budgetInput(), '2.000')
  await replace(within(stage(2)).getByLabelText(t.name), 'Visitas')
  await user.click(screen.getByRole('button', { name: t.addStage }))
  expect(bandNames()).toEqual(['Impressões', 'Cliques', 'Leads', 'Vendas'])

  await replace(budgetInput(), '2000')
  expect(bandNames()).toEqual(['Impressões', 'Visitas', 'Leads', 'Vendas', t.newStageName(5)])
})

test('conversão inválida é ignorada no 1º lugar e volta a valer quando a etapa desce', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(within(stage(2)).getByLabelText(t.conversion), 'abc')
  await user.click(within(stage(2)).getByRole('button', { name: t.moveUp }))
  expect(bandNames()).toEqual(['Cliques', 'Impressões', 'Leads', 'Vendas'])

  await user.click(within(stage(1)).getByRole('button', { name: t.moveDown }))
  expect(within(stage(2)).getByLabelText(t.conversion)).toHaveAttribute('aria-invalid', 'true')
  expect(bandNames()).toEqual(['Cliques', 'Impressões', 'Leads', 'Vendas'])
})

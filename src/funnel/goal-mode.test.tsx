import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { texts } from '../texts'

const t = texts.panel
const m = texts.mode
const f = texts.funnel

const panel = () => within(screen.getByRole('complementary', { name: t.label }))
const goalMode = () => panel().getByRole('radio', { name: m.goal })
const budgetMode = () => panel().getByRole('radio', { name: m.budget })
const targetSelect = () => panel().getByLabelText(t.goalTarget)
const goalInput = () => panel().queryByLabelText(t.goalQuantity) ?? panel().getByLabelText(t.goalRevenue)
const investment = () => screen.queryByRole('region', { name: f.investment })
const totalInvestment = () => screen.queryByRole('region', { name: f.investmentTotal })

function stage(n: number) {
  const group = panel().getByRole('group', { name: t.stageGroup(n) })
  const toggle = group.querySelector<HTMLElement>('[aria-expanded="false"]')
  if (toggle) fireEvent.click(toggle)
  return group
}

function bands() {
  return within(screen.getByRole('list', { name: f.listLabel })).getAllByRole('listitem')
}
const bandNames = () => bands().map((b) => b.querySelector('.funnel-band-name')!.textContent)
const volumes = () => bands().map((b) => b.querySelector('.funnel-band-volume')!.textContent)

function total(label: string) {
  const totals = screen.getByLabelText(f.totals.label)
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

async function enterGoalMode() {
  await userEvent.setup().click(goalMode())
}

test('o seletor fica no topo da barra e o app abre no modo orçamento', () => {
  render(<App />)
  expect(budgetMode()).toBeChecked()
  expect(goalMode()).not.toBeChecked()
  // O seletor vem antes de qualquer campo na barra.
  const firstControl = panel().getAllByRole('radio')[0]
  const budget = panel().getByLabelText(t.budget)
  expect(firstControl.compareDocumentPosition(budget) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(investment()).toBeNull()
  expect(totalInvestment()).toHaveTextContent('R$ 2.000,00')
})

test('no modo orçamento, o bloco mostra o investimento total (mídia + custos extras), sem arredondar', async () => {
  render(<App />)
  await replace(within(stage(3)).getByLabelText(t.extraCost), '0,005') // 300 leads × R$ 0,005 = R$ 1,50
  expect(totalInvestment()).toHaveTextContent('R$ 2.001,50')
  expect(totalInvestment()).toHaveTextContent(f.investmentDetail('R$ 2.000,00', 'R$ 1,50'))
  await replace(panel().getByLabelText(t.budget), '1000,333')
  // R$ 1.000,333 + 150 leads × R$ 0,005 = R$ 1.001,083: mostrado com 2 casas, sem subir o centavo.
  expect(totalInvestment()).toHaveTextContent('R$ 1.001,08')
  expect(total(f.totals.totalCost)).toBe('R$ 1.001,08')
})

test('no modo meta, a verba dá lugar a "Meta em" e ao valor da meta', async () => {
  render(<App />)
  await enterGoalMode()
  expect(panel().queryByLabelText(t.budget)).toBeNull()
  expect(targetSelect()).toBeInTheDocument()
  expect(goalInput()).toBeInTheDocument()
})

test('na primeira entrada, a meta vem na última etapa com o volume atual (45)', async () => {
  render(<App />)
  await enterGoalMode()
  expect(targetSelect()).toHaveDisplayValue('Vendas')
  expect(goalInput()).toHaveValue('45')
  const block = investment()!
  expect(block).toHaveTextContent('R$ 2.000,00')
  expect(block).toHaveTextContent(f.investmentDetail('R$ 2.000,00', 'R$ 0,00'))
  expect(volumes()).toEqual(['100.000', '2.500', '300', '45'])
})

test('digitar a meta recalcula a cada tecla, e o custo total é o total do bloco', async () => {
  render(<App />)
  await enterGoalMode()
  await replace(within(stage(3)).getByLabelText(t.extraCost), '2') // R$ 2 por lead
  const user = userEvent.setup()
  await user.clear(goalInput())
  await user.type(goalInput(), '9')
  expect(volumes()[3]).toBe('9')
  await user.type(goalInput(), '0')
  expect(volumes()[3]).toBe('90')
  // 90 vendas: R$ 4.000 de mídia + 600 leads × R$ 2.
  expect(investment()).toHaveTextContent('R$ 5.200,00')
  expect(investment()).toHaveTextContent(f.investmentDetail('R$ 4.000,00', 'R$ 1.200,00'))
  expect(total(f.totals.totalCost)).toBe('R$ 5.200,00')
  expect(total(f.totals.media)).toBe('R$ 4.000,00')
})

test('"Meta em" lista as etapas na ordem, mais Receita, e acompanha renomeações', async () => {
  render(<App />)
  await enterGoalMode()
  const options = () =>
    within(targetSelect())
      .getAllByRole('option')
      .map((o) => o.textContent)
  expect(options()).toEqual(['Impressões', 'Cliques', 'Leads', 'Vendas', t.revenueTarget])
  await replace(within(stage(2)).getByLabelText(t.name), 'Visitas')
  expect(options()).toEqual(['Impressões', 'Visitas', 'Leads', 'Vendas', t.revenueTarget])
})

test('com Receita, o valor da meta é em R$', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(within(stage(4)).getByLabelText(t.ticket), '200')
  await enterGoalMode()
  await user.selectOptions(targetSelect(), t.revenueTarget)
  expect(goalInput()).toHaveAccessibleName(t.goalRevenue)
  await replace(goalInput(), '9000')
  expect(investment()).toHaveTextContent('R$ 2.000,00')
  expect(total(f.totals.revenue)).toBe('R$ 9.000,00')
})

test('meta inválida deixa o campo vermelho e congela o funil; fração com vírgula vale', async () => {
  render(<App />)
  await enterGoalMode()
  for (const value of ['0', '', '1.5', '-1', 'abc']) {
    await replace(goalInput(), value)
    expect(goalInput()).toHaveAttribute('aria-invalid', 'true')
    expect(volumes()[3]).toBe('45')
  }
  await replace(goalInput(), '1,5')
  expect(goalInput()).not.toHaveAttribute('aria-invalid', 'true')
  expect(volumes()[3]).toBe('2') // 1,5 aparece arredondado na tela
})

test('meta impossível por conversão 0%: mensagem sem número e funil congelado', async () => {
  render(<App />)
  await enterGoalMode()
  await replace(within(stage(2)).getByLabelText(t.conversion), '0')
  expect(investment()).toHaveTextContent(f.impossible)
  expect(investment()).not.toHaveTextContent('R$')
  expect(volumes()).toEqual(['100.000', '2.500', '300', '45'])
})

test('meta de receita sem ticket é impossível', async () => {
  const user = userEvent.setup()
  render(<App />)
  await enterGoalMode()
  await user.selectOptions(targetSelect(), t.revenueTarget)
  await replace(goalInput(), '9000')
  expect(investment()).toHaveTextContent(f.impossible)
})

test('a faixa da etapa-alvo mostra a etiqueta "Meta"; com receita, a etiqueta vai na receita', async () => {
  const user = userEvent.setup()
  render(<App />)
  await enterGoalMode()
  const tagged = () => bands().filter((b) => within(b).queryByText(f.goalTag))
  expect(tagged()).toEqual([bands()[3]])

  await replace(within(stage(4)).getByLabelText(t.ticket), '200')
  await user.selectOptions(targetSelect(), t.revenueTarget)
  expect(tagged()).toEqual([])
  const totals = screen.getByLabelText(f.totals.label)
  const revenue = within(totals).getByText(f.totals.revenue).closest('.total')!
  expect(within(revenue as HTMLElement).getByText(f.goalTag)).toBeInTheDocument()
})

test('a meta segue a etapa reordenada; removida, passa para a última etapa', async () => {
  const user = userEvent.setup()
  render(<App />)
  await enterGoalMode()
  await user.selectOptions(targetSelect(), 'Leads')
  await replace(goalInput(), '600')
  await user.click(within(stage(3)).getByRole('button', { name: t.moveDown })) // Leads vai para o fim
  expect(targetSelect()).toHaveDisplayValue('Leads')
  expect(bandNames()).toEqual(['Impressões', 'Cliques', 'Vendas', 'Leads'])
  expect(volumes()[3]).toBe('600')

  await user.click(within(stage(4)).getByRole('button', { name: t.remove }))
  await user.click(within(stage(4)).getByRole('button', { name: t.yes }))
  expect(targetSelect()).toHaveDisplayValue('Vendas')
  expect(goalInput()).toHaveValue('600')
  expect(volumes()[2]).toBe('600')
})

test('cada modo guarda o seu valor ao alternar, e o bloco muda com o modo', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(panel().getByLabelText(t.budget), '3000')
  await enterGoalMode()
  await replace(goalInput(), '90')
  expect(investment()).not.toBeNull()

  await user.click(budgetMode())
  expect(investment()).toBeNull()
  expect(totalInvestment()).toHaveTextContent('R$ 3.000,00')
  expect(panel().getByLabelText(t.budget)).toHaveValue('3000')
  expect(total(f.totals.media)).toBe('R$ 3.000,00')

  await user.click(goalMode())
  expect(goalInput()).toHaveValue('90')
  expect(investment()).toHaveTextContent('R$ 4.000,00')
})

test('recarregar abre o funil no modo em que ele estava', async () => {
  const first = render(<App />)
  await enterGoalMode()
  first.unmount()
  render(<App />)
  expect(goalMode()).toBeChecked()
  expect(investment()).not.toBeNull()
  expect(totalInvestment()).toBeNull()
})

test('primeira entrada com volume final 0: a meta começa em 1', async () => {
  render(<App />)
  await replace(panel().getByLabelText(t.budget), '0')
  await enterGoalMode()
  expect(goalInput()).toHaveValue('1')
  expect(goalInput()).not.toHaveAttribute('aria-invalid', 'true')
})

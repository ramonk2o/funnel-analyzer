import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { texts } from '../texts'

// Extra tests written by the tester for "Modo meta".

const t = texts.panel
const m = texts.mode
const f = texts.funnel

const panel = () => within(screen.getByRole('complementary', { name: t.label }))
const goalMode = () => panel().getByRole('radio', { name: m.goal })
const budgetMode = () => panel().getByRole('radio', { name: m.budget })
const targetSelect = () => panel().getByLabelText(t.goalTarget)
const goalInput = () => panel().queryByLabelText(t.goalQuantity) ?? panel().getByLabelText(t.goalRevenue)
const investment = () => screen.queryByRole('region', { name: f.investment })
const toggleButton = () => within(screen.getByRole('banner')).getByRole('button', { name: /edição/ })

function stage(n: number) {
  const group = panel().getByRole('group', { name: t.stageGroup(n) })
  const toggle = group.querySelector<HTMLElement>('[aria-expanded="false"]')
  if (toggle) fireEvent.click(toggle)
  return group
}

const bands = () => within(screen.getByRole('list', { name: f.listLabel })).getAllByRole('listitem')
const volumes = () => bands().map((b) => b.querySelector('.funnel-band-volume')!.textContent)
const taggedBands = () => bands().filter((b) => within(b).queryByText(f.goalTag))

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

const enterGoalMode = () => userEvent.setup().click(goalMode())

test('extra: no modo meta, abrir a barra pelo botão põe o foco no valor da meta', async () => {
  const user = userEvent.setup()
  render(<App />)
  await enterGoalMode()
  await user.click(toggleButton()) // fecha
  await user.click(toggleButton()) // reabre
  expect(goalInput()).toHaveFocus()
})

test('extra: de volta ao modo orçamento, abrir a barra volta a focar a verba', async () => {
  const user = userEvent.setup()
  render(<App />)
  await enterGoalMode()
  await user.click(budgetMode())
  await user.click(toggleButton())
  await user.click(toggleButton())
  expect(panel().getByLabelText(t.budget)).toHaveFocus()
})

test('extra: ticket médio 0 com meta de receita é meta impossível, e o funil fica congelado', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(within(stage(4)).getByLabelText(t.ticket), '200')
  await enterGoalMode()
  await user.selectOptions(targetSelect(), t.revenueTarget)
  await replace(goalInput(), '9000')
  expect(total(f.totals.revenue)).toBe('R$ 9.000,00')
  await replace(within(stage(4)).getByLabelText(t.ticket), '0')
  expect(investment()).toHaveTextContent(f.impossible)
  expect(investment()).not.toHaveTextContent('R$')
  expect(volumes()).toEqual(['100.000', '2.500', '300', '45'])
  expect(total(f.totals.revenue)).toBe('R$ 9.000,00')
})

test('extra: apagar o ticket com meta de receita torna a meta impossível', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(within(stage(4)).getByLabelText(t.ticket), '200')
  await enterGoalMode()
  await user.selectOptions(targetSelect(), t.revenueTarget)
  await replace(goalInput(), '9000')
  await replace(within(stage(4)).getByLabelText(t.ticket), '')
  expect(investment()).toHaveTextContent(f.impossible)
})

test('extra: corrigir a conversão sai do estado impossível e recalcula', async () => {
  render(<App />)
  await enterGoalMode()
  await replace(goalInput(), '90')
  const conversion = within(stage(2)).getByLabelText(t.conversion)
  await replace(conversion, '0')
  expect(investment()).toHaveTextContent(f.impossible)
  expect(volumes()[3]).toBe('90')
  await replace(conversion, '5') // dobra a conversão de cliques: 90 vendas pedem metade da mídia
  expect(investment()).not.toHaveTextContent(f.impossible)
  expect(investment()).toHaveTextContent('R$ 2.000,00')
  expect(volumes()[1]).toBe('5.000')
})

test('extra: conversão 0% depois da etapa-alvo não torna a meta impossível (na tela)', async () => {
  const user = userEvent.setup()
  render(<App />)
  await enterGoalMode()
  await user.selectOptions(targetSelect(), 'Cliques')
  await replace(goalInput(), '2500')
  await replace(within(stage(4)).getByLabelText(t.conversion), '0')
  expect(investment()).toHaveTextContent('R$ 2.000,00')
  expect(volumes()).toEqual(['100.000', '2.500', '300', '0'])
})

test('extra: meta impossível ao voltar ao modo orçamento: o funil recalcula pela verba', async () => {
  const user = userEvent.setup()
  render(<App />)
  await enterGoalMode()
  await replace(within(stage(2)).getByLabelText(t.conversion), '0')
  expect(investment()).toHaveTextContent(f.impossible)
  await user.click(budgetMode())
  expect(investment()).toBeNull()
  expect(volumes()).toEqual(['100.000', '0', '0', '0'])
  await user.click(goalMode())
  expect(investment()).toHaveTextContent(f.impossible)
})

test('extra: removida a última etapa sendo ela a alvo, a meta passa para a nova última etapa', async () => {
  const user = userEvent.setup()
  render(<App />)
  await enterGoalMode()
  await replace(goalInput(), '30')
  await user.click(within(stage(4)).getByRole('button', { name: t.remove }))
  await user.click(within(stage(4)).getByRole('button', { name: t.yes }))
  expect(targetSelect()).toHaveDisplayValue('Leads')
  expect(goalInput()).toHaveValue('30')
  expect(volumes()).toHaveLength(3)
  expect(volumes()[2]).toBe('30')
  expect(taggedBands()).toEqual([bands()[2]])
})

test('extra: remover uma etapa que não é a alvo mantém a meta na mesma etapa', async () => {
  const user = userEvent.setup()
  render(<App />)
  await enterGoalMode()
  await user.selectOptions(targetSelect(), 'Leads')
  await replace(goalInput(), '600')
  await user.click(within(stage(4)).getByRole('button', { name: t.remove }))
  await user.click(within(stage(4)).getByRole('button', { name: t.yes }))
  expect(targetSelect()).toHaveDisplayValue('Leads')
  expect(volumes()[2]).toBe('600')
})

test('extra: adicionar uma etapa não leva a meta para a nova última etapa', async () => {
  const user = userEvent.setup()
  render(<App />)
  await enterGoalMode()
  await user.click(panel().getByRole('button', { name: t.addStage }))
  expect(targetSelect()).toHaveDisplayValue('Vendas')
  expect(volumes()[3]).toBe('45')
  expect(taggedBands()).toEqual([bands()[3]])
})

test('extra: a meta de receita sobrevive à remoção de etapas', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(within(stage(4)).getByLabelText(t.ticket), '200')
  await enterGoalMode()
  await user.selectOptions(targetSelect(), t.revenueTarget)
  await replace(goalInput(), '9000')
  await user.click(within(stage(3)).getByRole('button', { name: t.remove }))
  await user.click(within(stage(3)).getByRole('button', { name: t.yes }))
  expect(targetSelect()).toHaveDisplayValue(t.revenueTarget)
  expect(total(f.totals.revenue)).toBe('R$ 9.000,00')
})

test('extra: alternar de modo mantém também a etapa escolhida em "Meta em"', async () => {
  const user = userEvent.setup()
  render(<App />)
  await enterGoalMode()
  await user.selectOptions(targetSelect(), 'Leads')
  await replace(goalInput(), '600')
  await user.click(budgetMode())
  await user.click(goalMode())
  expect(targetSelect()).toHaveDisplayValue('Leads')
  expect(goalInput()).toHaveValue('600')
  expect(volumes()[2]).toBe('600')
})

test('extra: trocar a etapa-alvo mantém o valor e recalcula para a nova etapa', async () => {
  const user = userEvent.setup()
  render(<App />)
  await enterGoalMode()
  await replace(goalInput(), '300')
  await user.selectOptions(targetSelect(), 'Leads')
  expect(goalInput()).toHaveValue('300')
  expect(volumes()[2]).toBe('300')
  expect(investment()).toHaveTextContent('R$ 2.000,00')
  expect(taggedBands()).toEqual([bands()[2]])
})

test('extra: verba inválida não impede o modo meta, e volta vermelha no modo orçamento', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(panel().getByLabelText(t.budget), 'abc')
  await enterGoalMode()
  await replace(goalInput(), '90')
  expect(investment()).toHaveTextContent('R$ 4.000,00')
  expect(volumes()[3]).toBe('90')
  await user.click(budgetMode())
  expect(panel().getByLabelText(t.budget)).toHaveAttribute('aria-invalid', 'true')
  expect(panel().getByLabelText(t.budget)).toHaveValue('abc')
})

test('extra: meta inválida congela também o bloco do investimento no último valor', async () => {
  render(<App />)
  await enterGoalMode()
  await replace(goalInput(), '90')
  await replace(goalInput(), 'x')
  expect(goalInput()).toHaveAttribute('aria-invalid', 'true')
  expect(investment()).toHaveTextContent('R$ 4.000,00')
  expect(total(f.totals.totalCost)).toBe('R$ 4.000,00')
})

test('extra: o investimento é arredondado para cima no centavo (na tela, total igual ao bloco)', async () => {
  render(<App />)
  await enterGoalMode()
  // 1 venda: 2000/45 = 44,444... → R$ 44,45
  await replace(goalInput(), '1')
  expect(investment()).toHaveTextContent('R$ 44,45')
  expect(total(f.totals.totalCost)).toBe('R$ 44,45')
})

test('extra: meta fracionária grande e com vírgula é aceita', async () => {
  render(<App />)
  await enterGoalMode()
  await replace(goalInput(), '4500,5')
  expect(goalInput()).not.toHaveAttribute('aria-invalid', 'true')
  expect(volumes()[3]).toBe('4.501')
})

test('extra: entrar no modo meta com o volume final fracionário arredonda para cima', async () => {
  render(<App />)
  await replace(panel().getByLabelText(t.budget), '2010') // 45,225 vendas
  await enterGoalMode()
  expect(goalInput()).toHaveValue('46')
  expect(goalInput()).not.toHaveAttribute('aria-invalid', 'true')
})

test('extra: o bloco do investimento fica acima do desenho do funil', async () => {
  render(<App />)
  await enterGoalMode()
  const list = screen.getByRole('list', { name: f.listLabel })
  expect(investment()!.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

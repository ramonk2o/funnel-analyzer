import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { texts } from '../texts'

const t = texts.panel
const s = texts.sidebar

const panel = () => screen.queryByRole('complementary', { name: t.label })
const header = () => within(screen.getByRole('banner'))
const toggleButton = () => header().getByRole('button', { name: /edição/ })
const budget = () => within(panel()!).getByLabelText(t.budget)

function stage(n: number) {
  return within(panel()!).getByRole('group', { name: t.stageGroup(n) })
}

function funnel() {
  return within(screen.getByRole('list', { name: texts.funnel.listLabel }))
}

const highlighted = () =>
  funnel()
    .getAllByRole('listitem')
    .filter((b) => b.getAttribute('aria-current') === 'true')

test('na primeira visita a barra vem aberta, com o botão "Fechar edição" no cabeçalho', () => {
  render(<App />)
  expect(panel()).not.toBeNull()
  expect(toggleButton()).toHaveAccessibleName(s.close)
})

test('o botão fecha a barra e reabrir põe o foco na verba', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(toggleButton())
  expect(panel()).toBeNull()
  expect(toggleButton()).toHaveAccessibleName(s.open)

  await user.click(toggleButton())
  expect(panel()).not.toBeNull()
  expect(budget()).toHaveFocus()
})

test('o app lembra se a barra ficou aberta ou fechada', async () => {
  const user = userEvent.setup()
  const first = render(<App />)
  await user.click(toggleButton())
  first.unmount()

  const second = render(<App />)
  expect(panel()).toBeNull()
  await user.click(toggleButton())
  second.unmount()

  render(<App />)
  expect(panel()).not.toBeNull()
})

test('valor salvo inválido: a barra vem aberta', () => {
  localStorage.setItem(s.storageKey, '{quebrado')
  render(<App />)
  expect(panel()).not.toBeNull()
})

test('sem armazenamento: a barra vem aberta e o botão funciona', async () => {
  const spy = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
    throw new DOMException('blocked', 'SecurityError')
  })
  try {
    const user = userEvent.setup()
    render(<App />)
    expect(panel()).not.toBeNull()
    await user.click(toggleButton())
    expect(panel()).toBeNull()
  } finally {
    spy.mockRestore()
  }
})

test('Esc com o foco dentro da barra fecha e devolve o foco ao botão', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(budget())
  await user.keyboard('{Escape}')
  expect(panel()).toBeNull()
  expect(toggleButton()).toHaveFocus()
})

test('Esc com o foco fora da barra não faz nada', async () => {
  const user = userEvent.setup()
  render(<App />)
  act(() => funnel().getAllByRole('button')[0].focus())
  await user.keyboard('{Escape}')
  expect(panel()).not.toBeNull()
})

test('fechar com o foco num campo leva o foco ao botão e tira o destaque', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(within(stage(1)).getByLabelText(t.name))
  expect(highlighted()).toHaveLength(1)
  await user.keyboard('{Escape}')
  expect(toggleButton()).toHaveFocus()
  expect(highlighted()).toHaveLength(0)
})

test('com a barra fechada, clicar na faixa abre e foca o Nome; na conversão, a Conversão', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(toggleButton())
  await user.click(funnel().getByRole('button', { name: texts.funnel.editStage('Leads') }))
  expect(panel()).not.toBeNull()
  expect(within(stage(3)).getByLabelText(t.name)).toHaveFocus()

  await user.click(toggleButton())
  await user.click(funnel().getByRole('button', { name: texts.funnel.editConversion('Vendas') }))
  expect(panel()).not.toBeNull()
  expect(within(stage(4)).getByLabelText(t.conversion)).toHaveFocus()
})

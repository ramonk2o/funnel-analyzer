import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { texts } from '../texts'

const t = texts.panel

function stage(n: number) {
  const panel = screen.getByRole('complementary', { name: t.label })
  return within(panel).getByRole('group', { name: t.stageGroup(n) })
}

function toggle(n: number) {
  return stage(n).querySelector<HTMLElement>('[aria-expanded]')!
}

function funnelList() {
  return screen.getByRole('list', { name: texts.funnel.listLabel })
}

function bands() {
  return within(funnelList()).getAllByRole('listitem')
}

function bandNames() {
  return bands().map((b) => b.querySelector('.funnel-band-name')!.textContent)
}

function highlighted() {
  return bands()
    .filter((b) => b.getAttribute('aria-current') === 'true')
    .map((b) => b.querySelector('.funnel-band-name')!.textContent)
}

// The others fade only while some band is highlighted.
function dimming() {
  return funnelList().classList.contains('funnel-highlighting')
}

async function openStage(n: number) {
  if (toggle(n).getAttribute('aria-expanded') === 'false') await userEvent.setup().click(toggle(n))
}

async function replace(input: HTMLElement, value: string) {
  const user = userEvent.setup()
  await user.clear(input)
  if (value) {
    await user.click(input)
    await user.paste(value)
  }
}

test('as outras faixas só esmaecem enquanto há uma faixa destacada', async () => {
  const user = userEvent.setup()
  render(<App />)
  expect(dimming()).toBe(false)
  await user.click(within(stage(1)).getByLabelText(t.name))
  expect(dimming()).toBe(true)
  await user.click(screen.getByLabelText(t.budget))
  expect(dimming()).toBe(false)
})

test('etapa fora do funil congelado não esmaece as faixas', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(screen.getByLabelText(t.budget), 'x')
  await user.click(screen.getByRole('button', { name: t.addStage }))
  await user.click(within(stage(5)).getByLabelText(t.name))
  expect(highlighted()).toEqual([])
  expect(dimming()).toBe(false)
})

test('passar do campo para um botão do cabeçalho da mesma etapa tira o destaque', async () => {
  const user = userEvent.setup()
  render(<App />)
  await openStage(2)
  await user.click(within(stage(2)).getByLabelText(t.name))
  expect(highlighted()).toEqual(['Cliques'])
  act(() => within(stage(2)).getByRole('button', { name: t.remove }).focus())
  expect(highlighted()).toEqual([])
  act(() => toggle(2).focus())
  expect(highlighted()).toEqual([])
})

test('mover a etapa por setas tira o destaque; voltar ao campo destaca a nova posição', async () => {
  const user = userEvent.setup()
  render(<App />)
  await openStage(3)
  await user.click(within(stage(3)).getByLabelText(t.name))
  expect(highlighted()).toEqual(['Leads'])
  await user.click(within(stage(3)).getByRole('button', { name: t.moveUp }))
  expect(highlighted()).toEqual([])
  await user.click(within(stage(2)).getByLabelText(t.name))
  expect(bandNames()).toEqual(['Impressões', 'Leads', 'Cliques', 'Vendas'])
  expect(bands()[1]).toHaveAttribute('aria-current', 'true')
  expect(highlighted()).toEqual(['Leads'])
})

test('botões de confirmar a remoção não destacam', async () => {
  const user = userEvent.setup()
  render(<App />)
  await openStage(2)
  await user.click(within(stage(2)).getByRole('button', { name: t.remove }))
  for (const name of [t.yes, t.no]) {
    act(() => within(stage(2)).getByRole('button', { name }).focus())
    expect(highlighted()).toEqual([])
  }
})

test('campo inválido da própria etapa congela o funil e o destaque continua nela', async () => {
  const user = userEvent.setup()
  render(<App />)
  await openStage(3)
  const conversion = within(stage(3)).getByLabelText(t.conversion)
  await replace(conversion, 'x')
  expect(conversion).toHaveFocus()
  expect(conversion).toHaveAttribute('aria-invalid', 'true')
  expect(highlighted()).toEqual(['Leads'])
  await user.clear(conversion)
  await user.paste('20')
  expect(conversion).not.toHaveAttribute('aria-invalid')
  expect(highlighted()).toEqual(['Leads'])
})

test('renomear a etapa com foco mantém o destaque na faixa, com o nome novo', async () => {
  const user = userEvent.setup()
  render(<App />)
  await openStage(2)
  const name = within(stage(2)).getByLabelText(t.name)
  await user.clear(name)
  await user.type(name, 'Visitas')
  expect(highlighted()).toEqual(['Visitas'])
})

test('o ticket destaca a nova última faixa depois de adicionar uma etapa', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: t.addStage }))
  await openStage(5)
  await user.click(within(stage(5)).getByLabelText(t.ticket))
  expect(bands()).toHaveLength(5)
  expect(bands()[4]).toHaveAttribute('aria-current', 'true')
  expect(highlighted()).toHaveLength(1)
})

test('o ticket não marca nada fora da lista de faixas (receita)', async () => {
  const user = userEvent.setup()
  render(<App />)
  await openStage(4)
  await user.click(within(stage(4)).getByLabelText(t.ticket))
  const totals = document.querySelector<HTMLElement>(`dl[aria-label="${texts.funnel.totals.label}"]`)!
  expect(totals.querySelector('[aria-current]')).toBeNull()
  expect(document.querySelectorAll('[aria-current="true"]')).toHaveLength(1)
})

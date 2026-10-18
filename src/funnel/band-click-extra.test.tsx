import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import App from '../App'
import { texts } from '../texts'

const t = texts.panel

const panel = () => within(screen.getByRole('complementary', { name: t.label }))
const stage = (n: number) => panel().getByRole('group', { name: t.stageGroup(n) })
const isOpen = (n: number) => stage(n).querySelector('[aria-expanded]')!.getAttribute('aria-expanded') === 'true'
const openStages = () =>
  Array.from({ length: panel().getAllByRole('group').length }, (_, i) => i + 1).filter(isOpen)
const funnel = () => within(screen.getByRole('list', { name: texts.funnel.listLabel }))
const bandButton = (name: string) => funnel().getByRole('button', { name: texts.funnel.editStage(name) })
const conversionButton = (name: string) => funnel().getByRole('button', { name: texts.funnel.editConversion(name) })
const highlighted = () =>
  funnel()
    .getAllByRole('listitem')
    .filter((b) => b.getAttribute('aria-current') === 'true')
    .map((b) => b.querySelector('.funnel-band-name')!.textContent)

async function replace(input: HTMLElement, value: string) {
  const user = userEvent.setup()
  await user.clear(input)
  if (value) {
    await user.click(input)
    await user.paste(value)
  }
}

const originalScroll = Element.prototype.scrollIntoView
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  Element.prototype.scrollIntoView = originalScroll
})

function mockMatchMedia(reduce: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: reduce && q.includes('reduce'),
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  }))
}

test('[tester] clicar na faixa rola suavemente até a etapa', async () => {
  mockMatchMedia(false)
  const spy = vi.fn()
  Element.prototype.scrollIntoView = spy
  const user = userEvent.setup()
  render(<App />)
  await user.click(bandButton('Vendas'))
  expect(spy).toHaveBeenCalled()
  const last = spy.mock.calls.at(-1)!
  expect(last[0]).toMatchObject({ behavior: 'smooth' })
  expect(spy.mock.contexts.at(-1)).toBe(stage(4))
  vi.unstubAllGlobals()
})

test('[tester] com reduzir movimento, a rolagem não é animada', async () => {
  mockMatchMedia(true)
  const spy = vi.fn()
  Element.prototype.scrollIntoView = spy
  const user = userEvent.setup()
  render(<App />)
  await user.click(conversionButton('Leads'))
  expect(spy).toHaveBeenCalled()
  expect(spy.mock.calls.at(-1)![0].behavior).not.toBe('smooth')
  vi.unstubAllGlobals()
})

test('[tester] clicar de novo na mesma faixa depois de recolher reabre e foca', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(bandButton('Leads'))
  await user.click(stage(3).querySelector<HTMLElement>('[aria-expanded]')!) // recolhe
  expect(openStages()).toEqual([])
  await user.click(bandButton('Leads'))
  expect(openStages()).toEqual([3])
  expect(within(stage(3)).getByLabelText(t.name)).toHaveFocus()
})

test('[tester] faixa e depois conversão da mesma etapa movem o foco', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(bandButton('Leads'))
  await user.click(conversionButton('Leads'))
  expect(openStages()).toEqual([3])
  expect(within(stage(3)).getByLabelText(t.conversion)).toHaveFocus()
})

test('[tester] depois do clique, digitar edita a etapa e o foco não volta sozinho', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(bandButton('Cliques'))
  await user.keyboard('X')
  expect(within(stage(2)).getByLabelText(t.name)).toHaveValue('CliquesX')
  // Mudar a verba re-renderiza tudo; o foco não deve voltar ao Nome nem a etapa reabrir errado.
  await replace(screen.getByLabelText(t.budget), '3000')
  expect(screen.getByLabelText(t.budget)).toHaveFocus()
  expect(openStages()).toEqual([2])
})

test('[tester] destaque acompanha cliques sucessivos em faixas diferentes', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(bandButton('Cliques'))
  expect(highlighted()).toEqual(['Cliques'])
  await user.click(bandButton('Vendas'))
  expect(highlighted()).toEqual(['Vendas'])
  expect(openStages()).toEqual([4])
})

test('[tester] faixa de etapa sem nome é anunciada com o nome exibido', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(bandButton('Cliques'))
  await user.clear(within(stage(2)).getByLabelText(t.name))
  const name = texts.funnel.unnamedStage(2)
  expect(bandButton(name)).toBeInTheDocument()
  expect(conversionButton(name)).toBeInTheDocument()
})

test('[tester] Tab alcança faixas e conversões na ordem do funil', async () => {
  const user = userEvent.setup()
  render(<App />)
  bandButton('Impressões').focus()
  await user.tab()
  expect(conversionButton('Cliques')).toHaveFocus()
  await user.tab()
  expect(bandButton('Cliques')).toHaveFocus()
})

test('[tester] com o funil congelado, conversão de etapa removida não faz nada', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(screen.getByLabelText(t.budget), 'x')
  await user.click(within(stage(3)).getByRole('button', { name: t.remove }))
  await user.click(within(stage(3)).getByRole('button', { name: t.yes }))
  await user.click(stage(2).querySelector<HTMLElement>('[aria-expanded]')!)
  await user.click(conversionButton('Leads'))
  expect(openStages()).toEqual([2])
  const active = document.activeElement as HTMLElement
  expect(panel().queryAllByRole('textbox').includes(active)).toBe(false)
})

test('[tester] com o funil congelado, faixa de etapa que subiu para 1º abre na posição nova', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(screen.getByLabelText(t.budget), 'x')
  await user.click(within(stage(2)).getByRole('button', { name: t.moveUp }))
  await user.click(bandButton('Impressões')) // agora 2º no painel
  expect(openStages()).toEqual([2])
  expect(within(stage(2)).getByLabelText(t.name)).toHaveValue('Impressões')
  expect(within(stage(2)).getByLabelText(t.name)).toHaveFocus()
})

test('[tester] com o funil congelado, conversão de etapa que desceu de 1º foca a Conversão', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(screen.getByLabelText(t.budget), 'x')
  await user.click(within(stage(2)).getByRole('button', { name: t.moveUp })) // Impressões vira 2º
  // Impressões não tinha conversão no funil congelado: não há botão de conversão para ela.
  expect(funnel().queryByRole('button', { name: texts.funnel.editConversion('Impressões') })).toBeNull()
  await user.click(conversionButton('Leads'))
  expect(within(stage(3)).getByLabelText(t.conversion)).toHaveFocus()
})

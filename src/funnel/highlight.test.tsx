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

function bands() {
  return within(screen.getByRole('list', { name: texts.funnel.listLabel })).getAllByRole('listitem')
}

// Names of the highlighted bands (the current item of the funnel list).
function highlighted() {
  return bands()
    .filter((b) => b.getAttribute('aria-current') === 'true')
    .map((b) => b.querySelector('.funnel-band-name')!.textContent)
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

test('nada fica destacado ao abrir o app', () => {
  render(<App />)
  expect(highlighted()).toEqual([])
})

test('foco num campo da etapa destaca a faixa dela', async () => {
  const user = userEvent.setup()
  render(<App />)
  await openStage(2)
  await user.click(within(stage(2)).getByLabelText(t.name))
  expect(highlighted()).toEqual(['Cliques'])
  await user.click(within(stage(2)).getByLabelText(t.conversion))
  expect(highlighted()).toEqual(['Cliques'])
  await user.click(within(stage(2)).getByLabelText(t.extraCost))
  expect(highlighted()).toEqual(['Cliques'])
})

test('unidade e custo de mídia destacam a 1ª faixa; ticket, a última', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(within(stage(1)).getByLabelText(t.costUnit))
  expect(highlighted()).toEqual(['Impressões'])
  await user.click(within(stage(1)).getByLabelText(t.unitCost))
  expect(highlighted()).toEqual(['Impressões'])

  await openStage(4)
  await user.click(within(stage(4)).getByLabelText(t.ticket))
  expect(highlighted()).toEqual(['Vendas'])
})

test('foco na verba não destaca nada', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByLabelText(t.budget))
  expect(highlighted()).toEqual([])
})

test('botões do cabeçalho e etapa só aberta não destacam', async () => {
  render(<App />)
  await openStage(2) // aberta, foco no botão de abrir
  expect(highlighted()).toEqual([])
  for (const name of [t.moveUp, t.moveDown, t.remove]) {
    act(() => within(stage(2)).getByRole('button', { name }).focus())
    expect(highlighted()).toEqual([])
  }
})

test('o destaque some quando o foco sai dos campos', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(within(stage(1)).getByLabelText(t.name))
  expect(highlighted()).toEqual(['Impressões'])
  await user.click(screen.getByLabelText(t.budget))
  expect(highlighted()).toEqual([])

  await user.click(within(stage(1)).getByLabelText(t.name))
  await user.click(document.body)
  expect(highlighted()).toEqual([])
})

test('foco direto em outra etapa move o destaque', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(within(stage(1)).getByLabelText(t.unitCost))
  expect(highlighted()).toEqual(['Impressões'])
  await openStage(3)
  act(() => within(stage(3)).getByLabelText(t.conversion).focus())
  expect(highlighted()).toEqual(['Leads'])
})

test('o item destacado contém a faixa e a conversão acima dela', async () => {
  const user = userEvent.setup()
  render(<App />)
  await openStage(3)
  await user.click(within(stage(3)).getByLabelText(t.conversion))
  const current = bands().find((b) => b.getAttribute('aria-current') === 'true')!
  expect(current).toHaveTextContent('Leads')
  expect(current).toHaveTextContent('12%')
})

test('com o funil congelado, o destaque segue a etapa pela identidade', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(screen.getByLabelText(t.budget), 'x') // congela o funil
  await openStage(3)
  await user.click(within(stage(3)).getByRole('button', { name: t.moveUp })) // Leads vai para 2º no painel
  await user.click(within(stage(2)).getByLabelText(t.name))
  // O funil ainda mostra a ordem antiga; a faixa de Leads é a 3ª.
  expect(bands().map((b) => b.querySelector('.funnel-band-name')!.textContent)).toEqual([
    'Impressões',
    'Cliques',
    'Leads',
    'Vendas',
  ])
  expect(highlighted()).toEqual(['Leads'])
  expect(bands()[2]).toHaveAttribute('aria-current', 'true')
})

test('etapa que ainda não está no funil congelado não destaca nada', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(screen.getByLabelText(t.budget), 'x')
  await user.click(screen.getByRole('button', { name: t.addStage }))
  await user.click(within(stage(5)).getByLabelText(t.name))
  expect(highlighted()).toEqual([])
})

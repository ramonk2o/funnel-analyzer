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

const isOpen = (n: number) => stage(n).querySelector('[aria-expanded]')!.getAttribute('aria-expanded') === 'true'
const openStages = () => Array.from({ length: stageCount() }, (_, i) => i + 1).filter(isOpen)

function funnel() {
  return within(screen.getByRole('list', { name: texts.funnel.listLabel }))
}

const bandButton = (name: string) => funnel().getByRole('button', { name: texts.funnel.editStage(name) })
const conversionButton = (name: string) => funnel().getByRole('button', { name: texts.funnel.editConversion(name) })

function highlighted() {
  return funnel()
    .getAllByRole('listitem')
    .filter((b) => b.getAttribute('aria-current') === 'true')
    .map((b) => b.querySelector('.funnel-band-name')!.textContent)
}

async function replace(input: HTMLElement, value: string) {
  const user = userEvent.setup()
  await user.clear(input)
  if (value) {
    await user.click(input)
    await user.paste(value)
  }
}

test('clicar na faixa abre a etapa, recolhe a aberta e foca o Nome', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(bandButton('Leads'))
  expect(openStages()).toEqual([3])
  expect(within(stage(3)).getByLabelText(t.name)).toHaveFocus()
  expect(highlighted()).toEqual(['Leads'])
})

test('clicar na faixa de uma etapa já aberta mantém aberta e foca o Nome', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(bandButton('Impressões'))
  expect(openStages()).toEqual([1])
  expect(within(stage(1)).getByLabelText(t.name)).toHaveFocus()
})

test('clicar na conversão abre a etapa de baixo com foco na Conversão', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(conversionButton('Vendas'))
  expect(openStages()).toEqual([4])
  expect(within(stage(4)).getByLabelText(t.conversion)).toHaveFocus()
  expect(highlighted()).toEqual(['Vendas'])
})

test('faixa e conversão são botões acionáveis pelo teclado', async () => {
  const user = userEvent.setup()
  render(<App />)
  expect(funnel().queryByRole('button', { name: texts.funnel.editConversion('Impressões') })).toBeNull()

  bandButton('Cliques').focus()
  await user.keyboard('{Enter}')
  expect(within(stage(2)).getByLabelText(t.name)).toHaveFocus()

  conversionButton('Leads').focus()
  await user.keyboard(' ')
  expect(within(stage(3)).getByLabelText(t.conversion)).toHaveFocus()
})

test('com o funil congelado e etapas reordenadas, abre a etapa certa', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(screen.getByLabelText(t.budget), 'x') // congela o funil
  await user.click(within(stage(4)).getByRole('button', { name: t.moveUp })) // Vendas vai para 3º
  await user.click(bandButton('Vendas'))
  expect(openStages()).toEqual([3])
  expect(within(stage(3)).getByLabelText(t.name)).toHaveValue('Vendas')
  expect(within(stage(3)).getByLabelText(t.name)).toHaveFocus()
})

test('com o funil congelado, conversão de etapa que subiu para 1º foca o Nome', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(screen.getByLabelText(t.budget), 'x')
  await user.click(within(stage(2)).getByRole('button', { name: t.moveUp })) // Cliques vai para 1º
  await user.click(conversionButton('Cliques'))
  expect(openStages()).toEqual([1])
  expect(within(stage(1)).getByLabelText(t.name)).toHaveValue('Cliques')
  expect(within(stage(1)).getByLabelText(t.name)).toHaveFocus()
})

test('com o funil congelado, clicar na faixa de etapa removida não faz nada', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(screen.getByLabelText(t.budget), 'x')
  await user.click(within(stage(3)).getByRole('button', { name: t.remove }))
  await user.click(within(stage(3)).getByRole('button', { name: t.yes }))
  await user.click(stage(2).querySelector<HTMLElement>('[aria-expanded]')!) // abre Cliques
  const before = document.activeElement

  await user.click(bandButton('Leads'))
  expect(openStages()).toEqual([2])
  // O clique pode levar o foco ao próprio botão da faixa, mas nunca a um campo do painel.
  expect(document.activeElement === before || document.activeElement === bandButton('Leads')).toBe(true)
})

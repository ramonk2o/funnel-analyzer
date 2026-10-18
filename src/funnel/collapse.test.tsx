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

function toggle(n: number) {
  const button = within(stage(n))
    .getAllByRole('button')
    .find((b) => b.hasAttribute('aria-expanded'))
  if (!button) throw new Error(`stage ${n} has no toggle`)
  return button
}

const isOpen = (n: number) => toggle(n).getAttribute('aria-expanded') === 'true'
const openStages = () => Array.from({ length: stageCount() }, (_, i) => i + 1).filter(isOpen)
const hasFields = (n: number) => within(stage(n)).queryByLabelText(t.name) !== null

async function replace(input: HTMLElement, value: string) {
  const user = userEvent.setup()
  await user.clear(input)
  if (value) {
    await user.click(input)
    await user.paste(value)
  }
}

test('abre com a 1ª etapa aberta e as outras recolhidas, sem campos', () => {
  render(<App />)
  expect(openStages()).toEqual([1])
  expect(hasFields(1)).toBe(true)
  for (const n of [2, 3, 4]) expect(hasFields(n)).toBe(false)
})

test('abrir uma etapa recolhe a que estava aberta', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(toggle(3))
  expect(openStages()).toEqual([3])
  expect(hasFields(3)).toBe(true)
  expect(hasFields(1)).toBe(false)
})

test('clicar na etapa aberta a recolhe e nenhuma fica aberta', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(toggle(1))
  expect(openStages()).toEqual([])
  for (const n of [1, 2, 3, 4]) expect(hasFields(n)).toBe(false)
})

test('etapa recolhida mostra o nome e o resumo', async () => {
  render(<App />)
  expect(stage(2)).toHaveTextContent('Cliques')
  expect(stage(2)).toHaveTextContent('2,5%')
  expect(stage(3)).toHaveTextContent('12%')

  const user = userEvent.setup()
  await user.click(toggle(1)) // recolhe a 1ª
  expect(stage(1)).toHaveTextContent('Impressões')
  expect(stage(1)).toHaveTextContent('R$ 20,00 CPM')
})

test('etapa recolhida com nome vazio mostra "Etapa N (sem nome definido)"', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(toggle(3))
  await replace(within(stage(3)).getByLabelText(t.name), '')
  await user.click(toggle(3))
  expect(stage(3)).toHaveTextContent(texts.funnel.unnamedStage(3))
})

test('remover funciona com a etapa recolhida sem abri-la', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(within(stage(3)).getByRole('button', { name: t.remove }))
  expect(openStages()).toEqual([1])
  await user.click(within(stage(3)).getByRole('button', { name: t.yes }))
  expect(stageCount()).toBe(3)
  expect(openStages()).toEqual([1])
})

test('adicionar etapa abre a nova e recolhe a que estava aberta', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: t.addStage }))
  expect(openStages()).toEqual([5])
  expect(within(stage(5)).getByLabelText(t.name)).toHaveValue(t.newStageName(5))
})

test('reordenar pelas setas abre a etapa movida', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(within(stage(3)).getByRole('button', { name: t.moveUp })) // Leads sobe
  expect(openStages()).toEqual([2])
  expect(within(stage(2)).getByLabelText(t.name)).toHaveValue('Leads')

  await user.click(within(stage(4)).getByRole('button', { name: t.moveUp })) // Vendas sobe
  expect(openStages()).toEqual([3])
  expect(within(stage(3)).getByLabelText(t.name)).toHaveValue('Vendas')
})

test('remover a etapa aberta deixa nenhuma aberta', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(toggle(2))
  await user.click(within(stage(2)).getByRole('button', { name: t.remove }))
  await user.click(within(stage(2)).getByRole('button', { name: t.yes }))
  expect(stageCount()).toBe(3)
  expect(openStages()).toEqual([])
})

test('etapa recolhida com campo inválido mostra o aviso e não abre sozinha', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(toggle(2))
  await replace(within(stage(2)).getByLabelText(t.conversion), 'abc')
  // Aberta, o próprio campo mostra o erro.
  expect(within(stage(2)).queryByLabelText(t.invalidStage)).toBeNull()

  await user.click(toggle(3))
  expect(openStages()).toEqual([3])
  expect(within(stage(2)).getByLabelText(t.invalidStage)).toBeInTheDocument()
  expect(stage(2)).toHaveTextContent(texts.funnel.noValue)
  expect(within(stage(3)).queryByLabelText(t.invalidStage)).toBeNull()

  await user.click(toggle(2))
  await replace(within(stage(2)).getByLabelText(t.conversion), '5')
  await user.click(toggle(2))
  expect(within(stage(2)).queryByLabelText(t.invalidStage)).toBeNull()
  expect(stage(2)).toHaveTextContent('5%')
})

test('aviso de campo inválido cobre custo extra, custo de mídia e ticket', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(within(stage(1)).getByLabelText(t.unitCost), '0')
  await user.click(toggle(4))
  expect(within(stage(1)).getByLabelText(t.invalidStage)).toBeInTheDocument()
  expect(stage(1)).toHaveTextContent(texts.funnel.noValue)

  await replace(within(stage(4)).getByLabelText(t.ticket), 'x')
  await user.click(toggle(3))
  expect(within(stage(4)).getByLabelText(t.invalidStage)).toBeInTheDocument()

  await replace(within(stage(3)).getByLabelText(t.extraCost), '-1')
  await user.click(toggle(3))
  expect(within(stage(3)).getByLabelText(t.invalidStage)).toBeInTheDocument()
})

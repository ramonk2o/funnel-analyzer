import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { texts } from '../texts'

// Extra tests by the independent tester for "Etapas colapsáveis".

const t = texts.panel

function panel() {
  return screen.getByRole('complementary', { name: t.label })
}
function stage(n: number) {
  return within(panel()).getByRole('group', { name: t.stageGroup(n) })
}
function stageCount() {
  return within(panel()).getAllByRole('group').length
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
const marked = (n: number) => within(stage(n)).queryByLabelText(t.invalidStage) !== null

async function replace(input: HTMLElement, value: string) {
  const user = userEvent.setup()
  await user.clear(input)
  if (value) {
    await user.click(input)
    await user.paste(value)
  }
}

test('clicar no nome da etapa recolhida a abre, e clicar de novo recolhe', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(within(stage(2)).getByText('Cliques'))
  expect(openStages()).toEqual([2])
  await user.click(within(stage(2)).getByText(t.stageGroup(2)))
  expect(openStages()).toEqual([])
})

test('abre e recolhe pelo teclado (Enter e Espaço no botão)', async () => {
  const user = userEvent.setup()
  render(<App />)
  toggle(3).focus()
  await user.keyboard('{Enter}')
  expect(openStages()).toEqual([3])
  await user.keyboard(' ')
  expect(openStages()).toEqual([])
})

test('etapa recolhida mantém setas, arrastar e remover no cabeçalho', () => {
  render(<App />)
  const s = stage(3)
  expect(within(s).getByRole('button', { name: t.moveUp })).toBeEnabled()
  expect(within(s).getByRole('button', { name: t.moveDown })).toBeEnabled()
  expect(within(s).getByRole('button', { name: t.remove })).toBeEnabled()
  expect(s.querySelector('[draggable="true"]')).not.toBeNull()
})

test('reordenar para baixo pelas setas abre a etapa movida', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(within(stage(2)).getByRole('button', { name: t.moveDown })) // Cliques desce
  expect(openStages()).toEqual([3])
  expect(within(stage(3)).getByLabelText(t.name)).toHaveValue('Cliques')
})

test('mover a etapa aberta a mantém aberta na nova posição', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(within(stage(1)).getByRole('button', { name: t.moveDown }))
  expect(openStages()).toEqual([2])
  expect(within(stage(2)).getByLabelText(t.name)).toHaveValue('Impressões')
})

test('mover uma etapa com nenhuma aberta abre a movida', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(toggle(1))
  await user.click(within(stage(4)).getByRole('button', { name: t.moveUp }))
  expect(openStages()).toEqual([3])
  expect(within(stage(3)).getByLabelText(t.name)).toHaveValue('Vendas')
})

test('remover e depois cancelar ("Não") não abre nem recolhe nada', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(within(stage(3)).getByRole('button', { name: t.remove }))
  await user.click(within(stage(3)).getByRole('button', { name: t.no }))
  expect(stageCount()).toBe(4)
  expect(openStages()).toEqual([1])
})

test('arrastar (dragstart/dragend) no cabeçalho não abre nem recolhe', () => {
  render(<App />)
  const handle = stage(3).querySelector('[draggable="true"]') as HTMLElement
  fireEvent.dragStart(handle, { dataTransfer: { effectAllowed: '' } })
  fireEvent.dragEnd(handle)
  expect(openStages()).toEqual([1])
})

test('remover uma etapa acima da aberta mantém a mesma etapa aberta', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(toggle(3)) // Leads
  await user.click(within(stage(2)).getByRole('button', { name: t.remove }))
  await user.click(within(stage(2)).getByRole('button', { name: t.yes }))
  expect(openStages()).toEqual([2])
  expect(within(stage(2)).getByLabelText(t.name)).toHaveValue('Leads')
})

test('adicionar com nenhuma aberta abre a nova; adicionar depois de remover a aberta também', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(toggle(1))
  await user.click(screen.getByRole('button', { name: t.addStage }))
  expect(openStages()).toEqual([5])

  await user.click(within(stage(5)).getByRole('button', { name: t.remove }))
  await user.click(within(stage(5)).getByRole('button', { name: t.yes }))
  expect(openStages()).toEqual([])
  await user.click(screen.getByRole('button', { name: t.addStage }))
  expect(openStages()).toEqual([5])
})

test('adicionar até o máximo mantém só a última aberta', async () => {
  const user = userEvent.setup()
  render(<App />)
  const add = screen.getByRole('button', { name: t.addStage })
  for (let i = 0; i < 6; i++) await user.click(add)
  expect(stageCount()).toBe(10)
  expect(openStages()).toEqual([10])
})

test('resumo da 1ª etapa usa a unidade de custo escolhida (CPC e por unidade)', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.selectOptions(within(stage(1)).getByLabelText(t.costUnit), 'cpc')
  await replace(within(stage(1)).getByLabelText(t.unitCost), '1,5')
  await user.click(toggle(1))
  expect(stage(1)).toHaveTextContent('R$ 1,50 CPC')

  await user.click(toggle(1))
  await user.selectOptions(within(stage(1)).getByLabelText(t.costUnit), 'unit')
  await user.click(toggle(1))
  expect(stage(1)).toHaveTextContent(`R$ 1,50 ${texts.funnel.firstStageCost.unit}`)
})

test('resumo mostra conversão decimal como digitada', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(toggle(2))
  await replace(within(stage(2)).getByLabelText(t.conversion), '0,75')
  await user.click(toggle(2))
  expect(stage(2)).toHaveTextContent('0,75%')
})

test('conversão vazia: resumo "—" e cabeçalho marcado', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(toggle(2))
  await replace(within(stage(2)).getByLabelText(t.conversion), '')
  await user.click(toggle(2))
  expect(stage(2)).toHaveTextContent(texts.funnel.noValue)
  expect(marked(2)).toBe(true)
  expect(stage(2)).toHaveClass('stage-has-invalid')
})

test('conversão acima de 100: resumo "—" e cabeçalho marcado', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(toggle(2))
  await replace(within(stage(2)).getByLabelText(t.conversion), '150')
  await user.click(toggle(2))
  expect(stage(2)).toHaveTextContent(texts.funnel.noValue)
  expect(stage(2)).not.toHaveTextContent('150%')
  expect(marked(2)).toBe(true)
})

test('custo extra inválido marca o cabeçalho mas o resumo segue com a conversão', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(toggle(2))
  await replace(within(stage(2)).getByLabelText(t.extraCost), 'abc')
  await user.click(toggle(2))
  expect(marked(2)).toBe(true)
  expect(stage(2)).toHaveTextContent('2,5%')
})

test('nome só com espaços mostra "Etapa N (sem nome definido)"', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(toggle(2))
  await replace(within(stage(2)).getByLabelText(t.name), '   ')
  await user.click(toggle(2))
  expect(stage(2)).toHaveTextContent(texts.funnel.unnamedStage(2))
})

test('verba inválida não marca nenhuma etapa', async () => {
  render(<App />)
  await replace(screen.getByLabelText(t.budget), 'abc')
  for (const n of [1, 2, 3, 4]) expect(marked(n)).toBe(false)
})

test('etapa movida para a 1ª posição passa a resumir o custo de mídia; a antiga 1ª, a conversão', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(within(stage(2)).getByRole('button', { name: t.moveUp })) // Cliques sobe para 1ª
  await user.click(toggle(1)) // recolhe
  expect(stage(1)).toHaveTextContent('Cliques')
  expect(stage(1)).toHaveTextContent('R$ 20,00 CPM')
  expect(stage(2)).toHaveTextContent('Impressões')
  expect(stage(2)).toHaveTextContent('10%')
})

test('ticket inválido: o aviso acompanha a etapa que é a última', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(toggle(4))
  await replace(within(stage(4)).getByLabelText(t.ticket), 'x')
  await user.click(toggle(1))
  expect(marked(4)).toBe(true)

  // Removendo a última, o ticket passa para a nova última (recolhida), que fica marcada.
  await user.click(within(stage(4)).getByRole('button', { name: t.remove }))
  await user.click(within(stage(4)).getByRole('button', { name: t.yes }))
  expect(marked(3)).toBe(true)
})

test('não há etapa aberta marcada, mesmo com campo inválido', async () => {
  render(<App />)
  await replace(within(stage(1)).getByLabelText(t.unitCost), '0')
  expect(marked(1)).toBe(false)
  expect(stage(1)).not.toHaveClass('stage-has-invalid')
})

// ASSUMPTION (not decided by the entry): reordering by drag keeps the open stage as it was
// (the entry only says reordering by the arrows opens the moved stage).
test('arrastar e soltar uma etapa abre a etapa arrastada', () => {
  render(<App />)
  const handle = stage(3).querySelector('[draggable="true"]') as HTMLElement
  fireEvent.dragStart(handle, { dataTransfer: { effectAllowed: '' } })
  fireEvent.dragOver(stage(1))
  fireEvent.drop(stage(1))
  expect(openStages()).toEqual([1])
  expect(within(stage(1)).getByLabelText(t.name)).toHaveValue('Leads')
})

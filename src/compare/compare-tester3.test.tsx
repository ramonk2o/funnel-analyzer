import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { initialForm, setMode, updateStage, type FunnelForm } from '../funnel/form'
import { loadLibrary, saveLibrary } from '../funnels/storage'
import { texts } from '../texts'

// Extra tests written by the independent tester (third round).
const c = texts.compare
const fx = texts.funnels
const t = texts.panel
const f = texts.funnel

const withConversion = (form: FunnelForm, i: number, conversion: string) =>
  updateStage(form, form.stages[i].id, { conversion })
const base = () => initialForm()

function seed(funnels: [string, FunnelForm][], active = funnels[0][0]) {
  saveLibrary({ activeId: active, funnels: funnels.map(([name, form]) => ({ id: name, name, form })) }, localStorage)
  render(<App />)
}
const user = () => userEvent.setup()
const menuButton = (name: string) => screen.getByRole('button', { name: fx.menuButton(name) })
const menu = () => within(screen.getByRole('dialog', { name: fx.menuLabel }))
const cmp = () => within(screen.getByRole('region', { name: c.label }))
const choice = (name: string) => within(screen.getByRole('group', { name: c.selectionLabel })).getByRole('checkbox', { name })
const column = (name: string) => within(screen.getByRole('region', { name: c.columnLabel(name) }))
const panel = () => within(screen.getByRole('complementary', { name: t.label }))
const volumes = (name: string) =>
  column(name).getAllByRole('listitem').map((li) => li.querySelector('.funnel-band-volume')!.textContent)
const goalTagIndex = (name: string) =>
  column(name).getAllByRole('listitem').findIndex((li) => li.querySelector('.goal-tag') !== null)
const tableRow = (label: string) => {
  const header = within(screen.getByRole('table', { name: c.tableLabel })).getByRole('rowheader', { name: label })
  return within(header.closest('tr')!).getAllByRole('cell')
}
async function menuAction(active: string, action: string) {
  await user().click(menuButton(active))
  await user().click(menu().getByRole('button', { name: action }))
}
async function compare(active: string, ...others: string[]) {
  await menuAction(active, fx.compare)
  for (const name of others) await user().click(choice(name))
}
const saved = (name: string) => loadLibrary(localStorage)!.funnels.find((x) => x.name === name)!.form

test('tester3: sem valor comum, um funil com verba inválida mostra o aviso e "—"; o valor sozinho do outro fica sem destaque', async () => {
  seed([['Base', base()], ['Ruim', { ...base(), budget: 'abc' }]])
  await compare('Base', 'Ruim')
  await user().click(cmp().getByRole('checkbox', { name: c.sameValue }))
  expect(column('Ruim').getByText(f.fixFields)).toBeInTheDocument()
  const media = tableRow(f.totals.media)
  expect(media[1]).toHaveTextContent(f.noValue)
  expect(media[0]).not.toHaveClass('compare-best')
  expect(media[1]).not.toHaveClass('compare-best')
})

test('tester3: 3 colunas, uma inválida e duas empatadas: a linha toda igual fica sem destaque', async () => {
  const better = withConversion(base(), 3, '30') // 90 sales instead of 45
  seed([['A', better], ['B', better], ['Ruim', withConversion(base(), 1, 'x')]])
  await compare('A', 'B', 'Ruim')
  const sales = tableRow(c.volumeRow('Vendas'))
  expect(sales.map((cell) => cell.firstChild!.textContent)).toEqual(['90', '90', f.noValue])
  // A and B tie, and the "—" doesn't count, so the row is all equal among the present values: no highlight.
  expect(sales[0]).not.toHaveClass('compare-best')
  expect(sales[1]).not.toHaveClass('compare-best')
})

test('tester3: sem valor comum, no modo meta, cada funil usa a própria etapa-alvo', async () => {
  const a = { ...setMode(base(), 'goal', 45), goal: '45' } // goal on the last stage (Vendas)
  const bForm = base()
  const b = { ...bForm, mode: 'goal' as const, goalTarget: bForm.stages[2].id, goal: '600' } // Leads
  seed([['A', a], ['B', b]])
  await compare('A', 'B')
  await user().click(cmp().getByRole('checkbox', { name: c.sameValue }))
  expect(goalTagIndex('A')).toBe(3)
  expect(goalTagIndex('B')).toBe(2)
  expect(volumes('B')[2]).toBe('600')
})

test('tester3: remover a etapa da meta própria de um funil leva a meta dele para a última etapa (salvo)', async () => {
  const bForm = base()
  const b = { ...bForm, goalTarget: bForm.stages[2].id, goal: '600' } // Leads, mode budget
  seed([['A', base()], ['B', b]])
  await compare('A', 'B')
  // Remove "Leads" (position 3) from all, through the active funnel's sidebar.
  const header = panel().getByRole('button', { name: /Leads/ }).closest('.stage-header') as HTMLElement
  await user().click(within(header).getByRole('button', { name: t.remove }))
  await user().click(panel().getByRole('button', { name: t.yes }))
  const form = saved('B')
  expect(form.stages.map((s) => s.name)).toEqual(['Impressões', 'Cliques', 'Vendas'])
  expect(form.goalTarget).toBe(form.stages[2].id)
  expect(form.goal).toBe('600')
})

test('tester3: "Voltar ao funil" mostra o funil ativo no modo e com a verba salvos, não os da comparação', async () => {
  seed([['A', base()], ['B', base()]])
  await compare('A', 'B')
  const budget = cmp().getByLabelText(t.budget)
  await user().clear(budget)
  await user().type(budget, '9000')
  await user().click(cmp().getByRole('radio', { name: texts.mode.goal }))
  await user().click(cmp().getByRole('button', { name: c.back }))
  expect(panel().getByRole('radio', { name: texts.mode.budget })).toBeChecked()
  expect(panel().getByLabelText(t.budget)).toHaveValue('2000')
  expect(saved('A').mode).toBe('budget')
  expect(saved('B').budget).toBe('2000')
})

test('tester3: renomear uma etapa na barra muda o nome salvo da mesma posição em todos os comparados, e não nos outros', async () => {
  seed([['A', base()], ['B', base()], ['C', base()]])
  await compare('A', 'B')
  const name = panel().getAllByLabelText(t.name)[0]
  await user().clear(name)
  await user().type(name, 'Alcance')
  expect(saved('A').stages[0].name).toBe('Alcance')
  expect(saved('B').stages[0].name).toBe('Alcance')
  expect(saved('C').stages[0].name).toBe('Impressões')
})

test('tester3: importar um arquivo inválido durante a comparação', async () => {
  seed([['A', base()], ['B', base()]])
  await compare('A', 'B')
  await user().click(menuButton('A'))
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')!
  const file = new File(['não é json'], 'x.json', { type: 'application/json' })
  Object.defineProperty(file, 'text', { value: () => Promise.resolve('não é json') })
  await user().upload(input, file)
  expect(await screen.findByRole('alert')).toHaveTextContent(fx.invalidFile)
  // Assumption: a failed import keeps the comparison (the entry only says "Importar" leaves it).
  expect(screen.getByRole('region', { name: c.label })).toBeInTheDocument()
})

test('tester3: com 3 marcados, um funil incompatível mostra o motivo da incompatibilidade (não "Máximo de 3 funis")', async () => {
  const other = { ...base(), stages: base().stages.slice(0, 3) }
  seed([['A', base()], ['B', base()], ['C', base()], ['Diferente', other]])
  await compare('A', 'B', 'C')
  const box = choice('Diferente')
  expect(box).toBeDisabled()
  // Assumption: the incompatibility reason wins over the maximum.
  expect(box).toHaveAccessibleDescription(c.differentCount)
})

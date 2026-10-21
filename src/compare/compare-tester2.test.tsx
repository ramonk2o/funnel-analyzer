import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import App from '../App'
import { initialForm, setMode, updateStage, type FunnelForm } from '../funnel/form'
import { loadLibrary, saveLibrary } from '../funnels/storage'
import { texts } from '../texts'

// Extra tests written by the independent tester (second round).
const c = texts.compare
const fx = texts.funnels
const t = texts.panel
const f = texts.funnel

const withConversion = (form: FunnelForm, i: number, conversion: string) =>
  updateStage(form, form.stages[i].id, { conversion })
const rename = (form: FunnelForm, i: number, name: string) => updateStage(form, form.stages[i].id, { name })
const base = () => initialForm()
const moreLeads = () => ({ ...withConversion(initialForm(), 2, '24'), budget: '3000' })
const cheaper = () => ({ ...initialForm(), unitCost: '10' })

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
const tableRows = () =>
  within(screen.getByRole('table', { name: c.tableLabel }))
    .getAllByRole('rowheader')
    .map((h) => [h.textContent, ...within(h.closest('tr')!).getAllByRole('cell').map((cell) => cell.textContent)])
async function menuAction(active: string, action: string) {
  await user().click(menuButton(active))
  await user().click(menu().getByRole('button', { name: action }))
}
async function compare(active: string, ...others: string[]) {
  await menuAction(active, fx.compare)
  for (const name of others) await user().click(choice(name))
}
const saved = (name: string) => loadLibrary(localStorage)!.funnels.find((x) => x.name === name)!.form

test('tester2: com 3 marcados, desmarcar um reabilita os outros compatíveis', async () => {
  seed([['Base', base()], ['Mais leads', moreLeads()], ['Barato', cheaper()], ['Quarto', base()]])
  await compare('Base', 'Mais leads', 'Barato')
  expect(choice('Quarto')).toBeDisabled()
  await user().click(choice('Barato'))
  expect(choice('Quarto')).toBeEnabled()
  expect(choice('Barato')).toBeEnabled()
})

test('tester2: valor comum começa com a meta do funil ativo mesmo quando ele está no modo orçamento', async () => {
  // Active is in budget mode but has a goal from before: switching the comparison to goal mode uses it.
  const active = { ...setMode(base(), 'goal', 45), goal: '90', mode: 'budget' as const }
  seed([['Base', active], ['Mais leads', moreLeads()]])
  await compare('Base', 'Mais leads')
  expect(cmp().getByRole('radio', { name: texts.mode.budget })).toBeChecked()
  await user().click(cmp().getByRole('radio', { name: texts.mode.goal }))
  expect(cmp().getByLabelText(t.goalQuantity)).toHaveValue('90')
  expect(volumes('Mais leads')[3]).toBe('90')
  // Nothing saved changed.
  expect(saved('Base').mode).toBe('budget')
  expect(saved('Mais leads').mode).toBe('budget')
})

test('tester2: valor comum inválido marca o campo e todas as colunas pedem correção', async () => {
  seed([['Base', base()], ['Mais leads', moreLeads()]])
  await compare('Base', 'Mais leads')
  const budget = cmp().getByLabelText(t.budget)
  await user().clear(budget)
  await user().type(budget, 'abc')
  expect(budget).toHaveAttribute('aria-invalid', 'true')
  expect(column('Base').getByText(f.fixFields)).toBeInTheDocument()
  expect(column('Mais leads').getByText(f.fixFields)).toBeInTheDocument()
  expect(saved('Base').budget).toBe('2000')
})

test('tester2: clicar numa conversão de outro funil abre a barra nele, no campo de conversão', async () => {
  seed([['Base', base()], ['Mais leads', moreLeads()]])
  await compare('Base', 'Mais leads')
  await user().click(column('Mais leads').getByRole('button', { name: f.editConversion('Leads') }))
  expect(menuButton('Mais leads')).toBeInTheDocument()
  const group = panel().getByRole('group', { name: t.stageGroup(3) })
  expect(within(group).getByLabelText(t.conversion)).toHaveFocus()
  expect(within(group).getByLabelText(t.conversion)).toHaveValue('24')
})

test('tester2: sem valor comum, no modo meta, editar a meta na barra salva no funil sem mudar o modo dele', async () => {
  seed([['Base', base()], ['Mais leads', moreLeads()]])
  await compare('Base', 'Mais leads')
  await user().click(column('Mais leads').getByRole('button', { name: f.editStage('Leads') }))
  await user().click(cmp().getByRole('radio', { name: texts.mode.goal }))
  await user().click(cmp().getByRole('checkbox', { name: c.sameValue }))
  // Never set: empty, so the column asks for a fix.
  expect(column('Mais leads').getByText(f.fixFields)).toBeInTheDocument()
  const goal = panel().getByLabelText(t.goalQuantity)
  await user().type(goal, '30')
  expect(volumes('Mais leads')[3]).toBe('30')
  expect(saved('Mais leads').goal).toBe('30')
  expect(saved('Mais leads').mode).toBe('budget')
  expect(panel().queryByRole('radio', { name: texts.mode.goal })).toBeNull()
})

test('tester2: etapas com o mesmo nome: a tabela tem uma linha por etapa e atualiza certo', async () => {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
  const dupA = rename(base(), 1, 'Leads') // Impressões, Leads, Leads, Vendas
  const dupB = rename(moreLeads(), 1, 'Leads')
  seed([['A', dupA], ['B', dupB]])
  await compare('A', 'B')
  const before = tableRows()
  expect(before).toHaveLength(4 * 2 + 5)
  await user().click(column('A').getByRole('button', { name: f.editConversion('Vendas') }))
  const conv = within(panel().getByRole('group', { name: t.stageGroup(4) })).getByLabelText(t.conversion)
  await user().clear(conv)
  await user().type(conv, '30')
  const after = tableRows()
  expect(after).toHaveLength(4 * 2 + 5)
  expect(after.map((r) => r[0])).toEqual(before.map((r) => r[0]))
  expect(after.find((r) => r[0] === c.volumeRow('Vendas'))![1]).toBe('90')
  const keyWarnings = errors.mock.calls.filter((call) => String(call[0]).includes('same key'))
  errors.mockRestore()
  expect(keyWarnings).toEqual([])
})

test('tester2: apagar o ativo com 3 marcados mantém a comparação dos outros 2', async () => {
  seed([['Base', base()], ['Mais leads', moreLeads()], ['Barato', cheaper()]])
  await compare('Base', 'Mais leads', 'Barato')
  await user().click(column('Barato').getByRole('button', { name: f.editStage('Leads') }))
  await menuAction('Barato', fx.remove)
  await user().click(menu().getByRole('button', { name: fx.yes }))
  expect(screen.getByRole('table', { name: c.tableLabel })).toBeInTheDocument()
  expect(screen.queryByRole('region', { name: c.columnLabel('Barato') })).toBeNull()
  // The new active one is one of the compared.
  expect(menuButton('Base')).toBeInTheDocument()
})

test('tester2: renomear uma etapa muda os rótulos da tabela e o "Meta em" comum', async () => {
  seed([['Base', setMode(base(), 'goal', 45)], ['Mais leads', moreLeads()]])
  await compare('Base', 'Mais leads')
  await user().click(column('Base').getByRole('button', { name: f.editStage('Vendas') }))
  const name = within(panel().getByRole('group', { name: t.stageGroup(4) })).getByLabelText(t.name)
  await user().clear(name)
  await user().type(name, 'Pedidos')
  expect(cmp().getByLabelText(t.goalTarget)).toHaveDisplayValue('Pedidos')
  expect(tableRows().some((r) => r[0] === c.volumeRow('Pedidos'))).toBe(true)
  expect(saved('Mais leads').stages[3].name).toBe('Pedidos')
})

test('tester2: etapas com o mesmo nome: depois de renomear e remover, a tabela mostra as linhas certas', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  seed([['A', base()], ['B', moreLeads()]])
  await compare('A', 'B')
  await user().click(column('A').getByRole('button', { name: f.editStage('Cliques') }))
  const name = within(panel().getByRole('group', { name: t.stageGroup(2) })).getByLabelText(t.name)
  await user().clear(name)
  await user().type(name, 'Leads')
  await user().clear(name)
  await user().type(name, 'Visitas')
  const second = panel().getByRole('group', { name: t.stageGroup(3) })
  await user().click(within(second).getByRole('button', { name: t.remove }))
  await user().click(within(second).getByRole('button', { name: t.yes }))
  expect(tableRows().map((r) => r[0])).toEqual([
    c.volumeRow('Impressões'), c.costRow('Impressões'),
    c.volumeRow('Visitas'), c.costRow('Visitas'),
    c.volumeRow('Vendas'), c.costRow('Vendas'),
    f.totals.media, f.totals.totalCost, f.totals.revenue, f.totals.roas, f.totals.roi,
  ])
  vi.restoreAllMocks()
})

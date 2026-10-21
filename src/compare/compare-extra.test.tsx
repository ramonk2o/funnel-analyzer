import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { initialForm, setMode, updateStage, type FunnelForm } from '../funnel/form'
import { funnelToFile } from '../funnels/file'
import { loadLibrary, saveLibrary } from '../funnels/storage'
import { texts } from '../texts'

// Extra tests written by the independent tester.
const c = texts.compare
const fx = texts.funnels
const t = texts.panel
const f = texts.funnel

const withConversion = (form: FunnelForm, i: number, conversion: string) =>
  updateStage(form, form.stages[i].id, { conversion })
const base = () => initialForm()
const moreLeads = () => ({ ...withConversion(initialForm(), 2, '24'), budget: '3000' })

function seed(funnels: [string, FunnelForm][], active = funnels[0][0]) {
  saveLibrary({ activeId: active, funnels: funnels.map(([name, form]) => ({ id: name, name, form })) }, localStorage)
  render(<App />)
}
const user = () => userEvent.setup()
const menuButton = (name: string) => screen.getByRole('button', { name: fx.menuButton(name) })
const menu = () => within(screen.getByRole('dialog', { name: fx.menuLabel }))
const comparison = () => screen.queryByRole('region', { name: c.label })
const cmp = () => within(screen.getByRole('region', { name: c.label }))
const choice = (name: string) => within(screen.getByRole('group', { name: c.selectionLabel })).getByRole('checkbox', { name })
const column = (name: string) => within(screen.getByRole('region', { name: c.columnLabel(name) }))
const panel = () => within(screen.getByRole('complementary', { name: t.label }))
const volumes = (name: string) =>
  column(name).getAllByRole('listitem').map((li) => li.querySelector('.funnel-band-volume')!.textContent)
const bandNames = (name: string) =>
  column(name).getAllByRole('listitem').map((li) => li.querySelector('.funnel-band-name')!.textContent)
function tableRow(label: string) {
  const table = screen.getByRole('table', { name: c.tableLabel })
  const header = within(table).getByRole('rowheader', { name: label })
  return within(header.closest('tr')!).getAllByRole('cell').map((cell) => cell.textContent)
}
async function menuAction(active: string, action: string) {
  await user().click(menuButton(active))
  await user().click(menu().getByRole('button', { name: action }))
}
async function compare(active: string, ...others: string[]) {
  await menuAction(active, fx.compare)
  for (const name of others) await user().click(choice(name))
}
const saved = (id: string) => loadLibrary(localStorage)!.funnels.find((x) => x.name === id)!.form

test('extra: Exportar mantém a comparação', async () => {
  // jsdom has no URL.createObjectURL
  URL.createObjectURL ??= () => 'blob:x'
  URL.revokeObjectURL ??= () => {}
  seed([['Base', base()], ['Mais leads', moreLeads()]])
  await compare('Base', 'Mais leads')
  await menuAction('Base', fx.export)
  expect(comparison()).not.toBeNull()
  expect(screen.getByRole('table', { name: c.tableLabel })).toBeInTheDocument()
})

test('extra: Importar sai da comparação', async () => {
  seed([['Base', base()], ['Mais leads', moreLeads()]])
  await compare('Base', 'Mais leads')
  await user().click(menuButton('Base'))
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')!
  const text = funnelToFile({ name: 'Importado', form: base() })
  const file = new File([text], 'f.json', { type: 'application/json' })
  Object.defineProperty(file, 'text', { value: () => Promise.resolve(text) })
  await user().upload(input, file)
  await screen.findByRole('button', { name: fx.menuButton('Importado') })
  expect(comparison()).toBeNull()
})

test('extra: com Base marcado, o incompatível fica desabilitado e o compatível habilitado', async () => {
  // Compatibility is checked against the first marked funnel: compatibles enable, others gray.
  const b2bLike = { ...base(), stages: base().stages.map((s, i) => (i === 3 ? { ...s, name: 'Compras' } : s)) }
  seed([['Base', base()], ['Outro', b2bLike], ['Mais leads', moreLeads()]])
  await menuAction('Base', fx.compare)
  expect(choice('Outro')).toBeDisabled()
  expect(choice('Mais leads')).toBeEnabled()
})

test('extra: nomes com maiúsculas e espaços diferentes são compatíveis no menu', async () => {
  const loose = { ...base(), stages: base().stages.map((s) => ({ ...s, name: `  ${s.name.toUpperCase()} ` })) }
  seed([['Base', base()], ['Gritado', loose]])
  await menuAction('Base', fx.compare)
  expect(choice('Gritado')).toBeEnabled()
})

test('extra: o destaque da etapa em edição só aparece na coluna do funil ativo (mesmos ids de etapa)', async () => {
  // A duplicate keeps the stage ids: the other column must not light up too.
  seed([['Base', base()], ['Cópia', base()]])
  await compare('Base', 'Cópia')
  await user().click(column('Base').getByRole('button', { name: f.editStage('Leads') }))
  const current = (name: string) =>
    column(name).getAllByRole('listitem').map((li) => li.getAttribute('aria-current'))
  expect(current('Base')).toEqual([null, null, 'true', null])
  expect(current('Cópia')).toEqual([null, null, null, null])
})

test('extra: o seletor de modo da comparação não muda o modo salvo de nenhum funil', async () => {
  seed([['Base', base()], ['Mais leads', moreLeads()]])
  await compare('Base', 'Mais leads')
  await user().click(cmp().getByRole('radio', { name: texts.mode.goal }))
  expect(saved('Base').mode).toBe('budget')
  expect(saved('Mais leads').mode).toBe('budget')
  await user().click(cmp().getByRole('button', { name: c.back }))
  expect(panel().getByRole('radio', { name: texts.mode.budget })).toBeChecked()
})

test('extra: modo meta, valor comum, ativo sem meta: o campo começa vazio e é inválido', async () => {
  seed([['Base', base()], ['Mais leads', moreLeads()]])
  await compare('Base', 'Mais leads')
  await user().click(cmp().getByRole('radio', { name: texts.mode.goal }))
  const goal = cmp().getByLabelText(t.goalQuantity)
  expect(goal).toHaveValue('')
  expect(column('Base').queryAllByRole('listitem')).toHaveLength(0)
  expect(screen.getByRole('region', { name: c.columnLabel('Base') })).toHaveTextContent(f.fixFields)
})

test('extra: valor comum, "Meta em" Receita vale para todos', async () => {
  seed([["Base", { ...base(), ticket: "100" }], ["Mais leads", { ...moreLeads(), ticket: "100" }]])
  await compare("Base", "Mais leads")
  await user().click(cmp().getByRole("radio", { name: texts.mode.goal }))
  await user().selectOptions(cmp().getByLabelText(t.goalTarget), t.revenueTarget)
  await user().type(cmp().getByLabelText(t.goalRevenue), '10000')
  for (const v of tableRow(f.totals.revenue)) expect(v).toMatch(/^R\$ 10\.000,/)
})

test('extra: valor comum desligado no modo meta: a barra mostra a meta e "Meta em" do próprio funil; meta nunca definida é inválida', async () => {
  const goalSet = { ...setMode(base(), 'goal', 45), goal: '90', mode: 'budget' as const }
  seed([['Base', goalSet], ['Mais leads', moreLeads()]])
  await compare('Base', 'Mais leads')
  await user().click(cmp().getByRole('radio', { name: texts.mode.goal }))
  await user().click(cmp().getByRole('checkbox', { name: c.sameValue }))
  expect(volumes('Base')[3]).toBe('90')
  expect(screen.getByRole('region', { name: c.columnLabel('Mais leads') })).toHaveTextContent(f.fixFields)
  expect(tableRow(c.volumeRow('Vendas'))[1]).toBe(f.noValue)

  await user().click(column('Base').getByRole('button', { name: f.editStage('Leads') }))
  expect(panel().getByLabelText(t.goalQuantity)).toHaveValue('90')
  expect(panel().getByLabelText(t.goalTarget)).toHaveDisplayValue('Vendas')
  expect(panel().queryByLabelText(t.budget)).toBeNull()
})

test('extra: adicionar durante a comparação põe 10% na etapa nova de cada funil e salva todos', async () => {
  seed([['Base', base()], ['Mais leads', moreLeads()]])
  await compare('Base', 'Mais leads')
  await user().click(column('Base').getByRole('button', { name: f.editStage('Leads') }))
  await user().click(panel().getByRole('button', { name: t.addStage }))
  expect(volumes('Base')[4]).toBe('5') // 45 * 10% rounded for display (4,5)
  expect(volumes('Mais leads')[4]).toBe('9')
  expect(saved('Mais leads').stages).toHaveLength(5)
  expect(saved('Mais leads').stages[4]).toMatchObject({ name: 'Etapa 5', conversion: '10' })
})

test('extra: depois de remover uma etapa, "Meta em" (valor comum) mostra a etapa usada no cálculo', async () => {
  const active = { ...setMode(base(), 'goal', 45), goal: '90' }
  seed([['Base', active], ['Mais leads', moreLeads()]])
  await compare('Base', 'Mais leads')
  expect(cmp().getByLabelText(t.goalTarget)).toHaveDisplayValue('Vendas')
  await user().click(column('Base').getByRole('button', { name: f.editStage('Leads') }))
  const second = panel().getByRole('group', { name: t.stageGroup(2) })
  await user().click(within(second).getByRole('button', { name: t.remove }))
  await user().click(within(second).getByRole('button', { name: t.yes }))
  expect(bandNames('Base')).toEqual(['Impressões', 'Leads', 'Vendas'])
  // The calculation still aims at the last stage (90 Vendas)...
  expect(volumes('Base')[2]).toBe('90')
  // ...so the selector should say so.
  expect(cmp().getByLabelText(t.goalTarget)).toHaveDisplayValue('Vendas')
})

test('extra: remover no máximo de etapas comparadas não passa do mínimo (2)', async () => {
  const two = { ...base(), stages: base().stages.slice(0, 2) }
  seed([['A', two], ['B', two]])
  await compare('A', 'B')
  await user().click(column('A').getByRole('button', { name: f.editStage('Cliques') }))
  const first = panel().getByRole('group', { name: t.stageGroup(1) })
  expect(within(first).getByRole("button", { name: t.remove })).toBeDisabled()
})

test('extra: desmarcar e remarcar mantém a comparação funcionando, e a ordem das colunas é a ordem de marcação', async () => {
  seed([['Base', base()], ['Mais leads', moreLeads()], ['Cópia', base()]])
  await compare('Base', 'Cópia', 'Mais leads')
  const names = () => screen.getAllByRole('region').filter((r) => r.className.includes('compare-column')).map((r) => r.querySelector('h3')!.textContent)
  expect(names()).toEqual(['Base', 'Cópia', 'Mais leads'])
})

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { initialForm, type FunnelForm } from '../funnel/form'
import { formatMoney, formatRoi, formatVolume } from '../funnel/numbers'
import { comparisonRows } from '../compare/table'
import { saveLibrary } from '../funnels/storage'
import { texts } from '../texts'

const s = texts.settings
const fx = texts.funnels
const t = texts.panel
const f = texts.funnel
const c = texts.compare

const user = () => userEvent.setup()
const gear = () => screen.getByRole('button', { name: s.open })
const modal = () => screen.getByRole('dialog', { name: s.title })
const queryModal = () => screen.queryByRole('dialog', { name: s.title })
const panel = () => within(screen.getByRole('complementary', { name: t.label }))
const menuButton = (name: string) => screen.getByRole('button', { name: fx.menuButton(name) })
const menu = () => within(screen.getByRole('dialog', { name: fx.menuLabel }))

function seed(funnels: [string, FunnelForm][], active = funnels[0][0]) {
  saveLibrary({ activeId: active, funnels: funnels.map(([name, form]) => ({ id: name, name, form })) }, localStorage)
  render(<App />)
}

async function choose(option: string) {
  await user().click(gear())
  await user().click(within(modal()).getByRole('radio', { name: option }))
  await user().click(within(modal()).getByRole('button', { name: s.close }))
}

async function replace(input: HTMLElement, value: string) {
  await user().clear(input)
  if (value) await user().type(input, value)
}

describe('extra (rodada 4)', () => {
  test('comparação em modo meta: a meta comum segue o separador nos dois sentidos', async () => {
    seed([
      ['A', { ...initialForm() }],
      ['B', { ...initialForm(), unitCost: '10' }],
    ])
    await user().click(menuButton('A'))
    await user().click(menu().getByRole('button', { name: fx.compare }))
    await user().click(screen.getByRole('checkbox', { name: 'B' }))
    const region = within(screen.getByRole('region', { name: c.label }))
    await user().click(region.getByRole('radio', { name: texts.mode.goal }))
    const goal = () => region.getByLabelText(t.goalQuantity)
    await replace(goal(), '12,5')
    expect(goal()).not.toHaveAttribute('aria-invalid')

    await choose(s.dot)
    expect(goal()).toHaveValue('12.5')
    expect(goal()).not.toHaveAttribute('aria-invalid')
    await replace(goal(), '7,5')
    expect(goal()).toHaveAttribute('aria-invalid', 'true')
    await replace(goal(), '7.5')
    expect(goal()).not.toHaveAttribute('aria-invalid')

    await choose(s.comma)
    expect(goal()).toHaveValue('7,5')
  })

  test('texto sem número ("abc") fica igual ao trocar o separador e continua inválido', async () => {
    render(<App />)
    const cost = panel().getByLabelText(t.unitCost)
    await replace(cost, 'abc')
    await choose(s.dot)
    expect(cost).toHaveValue('abc')
    expect(cost).toHaveAttribute('aria-invalid', 'true')
  })

  test('importar com ponto um arquivo com os dois sinais mostra os sinais trocados e inválido', async () => {
    render(<App />)
    await choose(s.dot)
    const file = JSON.stringify({ app: fx.fileApp, version: 1, name: 'Dois', funnel: { ...initialForm(), budget: '1.234,5' } })
    await user().upload(screen.getByLabelText(fx.importFile), new File([file], 'Dois.json', { type: 'application/json' }))
    expect(await screen.findByRole('button', { name: fx.menuButton('Dois') })).toBeInTheDocument()
    const budget = panel().getByLabelText(t.budget)
    expect(budget).toHaveValue('1,234.5')
    expect(budget).toHaveAttribute('aria-invalid', 'true')
  })

  test('depois de escolher o tema claro, abrir de novo põe o foco em "Claro"', async () => {
    render(<App />)
    await choose(s.light)
    await user().click(gear())
    expect(within(modal()).getByRole('radio', { name: s.light })).toHaveFocus()
  })

  test('trocar o separador dentro do modal não fecha o modal nem tira o foco dele', async () => {
    render(<App />)
    await user().click(gear())
    await user().click(within(modal()).getByRole('radio', { name: s.dot }))
    expect(queryModal()).not.toBeNull()
    expect(modal()).toContainElement(document.activeElement as HTMLElement)
    expect(panel().getByLabelText(t.unitCost)).toHaveValue(
      (panel().getByLabelText(t.unitCost) as HTMLInputElement).value.replace(',', '.'),
    )
  })

  test('na comparação com valor próprio de cada funil, o campo do painel segue o separador', async () => {
    seed([
      ['A', { ...initialForm(), budget: '1500,75' }],
      ['B', { ...initialForm(), unitCost: '10' }],
    ])
    await user().click(menuButton('A'))
    await user().click(menu().getByRole('button', { name: fx.compare }))
    await user().click(screen.getByRole('checkbox', { name: 'B' }))
    await user().click(screen.getByRole('checkbox', { name: c.sameValue }))
    await choose(s.dot)
    expect(panel().getByLabelText(t.budget)).toHaveValue('1500.75')
    const table = within(screen.getByRole('table', { name: c.tableLabel }))
    const media = within(table.getByRole('rowheader', { name: f.totals.media }).closest('tr')!)
    expect(media.getAllByRole('cell')[0].textContent).toMatch(/^R\$ 1,500\.75/)
  })
})

describe('extra (rodada 4): formatos', () => {
  test('ROI negativo e volumes arredondados com ponto', () => {
    expect(formatRoi(-0.5, 'dot')).toBe('-50.0%')
    expect(formatVolume(999.6, 'dot')).toBe('1,000')
    expect(formatMoney(1000000, 'dot')).toBe('R$ 1,000,000.00')
  })

  test('tabela da comparação com ponto: "—" continua igual para resultado ausente', () => {
    const rows = comparisonRows(['Etapa 1'], [null], 'dot')
    for (const row of rows) expect(row.values).toEqual([f.noValue])
  })
})

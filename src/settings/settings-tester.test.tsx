import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { initialForm, type FunnelForm } from '../funnel/form'
import { saveLibrary } from '../funnels/storage'
import { texts } from '../texts'

const s = texts.settings
const fx = texts.funnels
const t = texts.panel
const f = texts.funnel
const m = texts.mode

const user = () => userEvent.setup()
const gear = () => screen.getByRole('button', { name: s.open })
const modal = () => screen.getByRole('dialog', { name: s.title })
const queryModal = () => screen.queryByRole('dialog', { name: s.title })
const panel = () => within(screen.getByRole('complementary', { name: t.label }))
const totals = () => screen.getByLabelText(f.totals.label)

function seed(funnels: [string, FunnelForm][], active = funnels[0][0]) {
  saveLibrary({ activeId: active, funnels: funnels.map(([name, form]) => ({ id: name, name, form })) }, localStorage)
  render(<App />)
}

async function choose(option: string) {
  await user().click(gear())
  await user().click(within(modal()).getByRole('radio', { name: option }))
  await user().click(within(modal()).getByRole('button', { name: s.close }))
}

async function openStage(n: number) {
  const group = panel().getByRole('group', { name: t.stageGroup(n) })
  const toggle = group.querySelector<HTMLElement>('[aria-expanded="false"]')
  if (toggle) await user().click(toggle)
}

async function replace(input: HTMLElement, value: string) {
  await user().clear(input)
  if (value) await user().type(input, value)
}

describe('modal (testes extras)', () => {
  test('depois de clicar numa área sem controle dentro do modal, Esc ainda fecha', async () => {
    render(<App />)
    await user().click(gear())
    await user().click(within(modal()).getByRole('heading', { name: s.title }))
    await user().keyboard('{Escape}')
    expect(queryModal()).toBeNull()
    expect(gear()).toHaveFocus()
  })

  test('depois de clicar numa área sem controle dentro do modal, o Tab não sai do modal', async () => {
    render(<App />)
    await user().click(gear())
    await user().click(within(modal()).getByRole('heading', { name: s.title }))
    await user().tab()
    expect(modal()).toContainElement(document.activeElement as HTMLElement)
  })

  test('as setas trocam a opção pelo teclado, e a troca vale na hora', async () => {
    render(<App />)
    await user().click(gear())
    // The focus starts on the theme; Tab goes through the accent color to the separator's checked option.
    await user().tab()
    await user().tab()
    expect(within(modal()).getByRole('radio', { name: s.comma })).toHaveFocus()
    await user().keyboard('{ArrowRight}')
    expect(within(modal()).getByRole('radio', { name: s.dot })).toBeChecked()
    expect(totals()).toHaveTextContent('R$ 2,000.00')
  })

  test('marcar a opção já marcada não muda nada', async () => {
    seed([['Meu funil', { ...initialForm(), unitCost: '20,5' }]])
    await choose(s.comma)
    expect(panel().getByLabelText(t.unitCost)).toHaveValue('20,5')
  })
})

describe('conversão (testes extras)', () => {
  test('campo com os dois sinais: trocados entre si e continua inválido, nos dois sentidos', async () => {
    seed([['Meu funil', { ...initialForm(), budget: '1.234,5' }]])
    const budget = () => panel().getByLabelText(t.budget)
    expect(budget()).toHaveAttribute('aria-invalid', 'true')
    await choose(s.dot)
    expect(budget()).toHaveValue('1,234.5')
    expect(budget()).toHaveAttribute('aria-invalid', 'true')
    await choose(s.comma)
    expect(budget()).toHaveValue('1.234,5')
    expect(budget()).toHaveAttribute('aria-invalid', 'true')
  })

  test('com ponto, "2,000" deixa o campo inválido (a vírgula não é milhar)', async () => {
    render(<App />)
    await choose(s.dot)
    const budget = panel().getByLabelText(t.budget)
    await replace(budget, '2,000')
    expect(budget).toHaveValue('2,000')
    expect(budget).toHaveAttribute('aria-invalid', 'true')
  })

  test('com ponto, ".5" e "1." valem ao digitar', async () => {
    render(<App />)
    await choose(s.dot)
    const cost = panel().getByLabelText(t.unitCost)
    await replace(cost, '.5')
    expect(cost).toHaveValue('.5')
    expect(cost).not.toHaveAttribute('aria-invalid')
    await replace(cost, '1.')
    expect(cost).toHaveValue('1.')
    expect(cost).not.toHaveAttribute('aria-invalid')
  })

  test('valor digitado com ponto continua o mesmo número depois de voltar para vírgula e recarregar', async () => {
    const { unmount } = render(<App />)
    await choose(s.dot)
    await replace(panel().getByLabelText(t.unitCost), '12.75')
    await choose(s.comma)
    expect(panel().getByLabelText(t.unitCost)).toHaveValue('12,75')
    unmount()
    render(<App />)
    expect(panel().getByLabelText(t.unitCost)).toHaveValue('12,75')
    expect(screen.getByRole('list', { name: f.listLabel })).toHaveTextContent('R$ 12,75 CPM')
  })

  test('ticket médio e custo extra da etapa seguem o separador; ROAS e ROI também', async () => {
    const form = initialForm()
    form.ticket = '150,5'
    form.stages[1] = { ...form.stages[1], extraCost: '100,25' }
    seed([['Meu funil', form]])
    await choose(s.dot)
    await openStage(4)
    expect(panel().getByLabelText(t.ticket)).toHaveValue('150.5')
    expect(within(totals()).getByText(f.totals.roas).nextElementSibling!.textContent).toMatch(/^\d+\.\d{2}x$/)
    expect(within(totals()).getByText(f.totals.roi).nextElementSibling!.textContent).toMatch(/^-?[\d,]+\.\d%$/)
    expect(totals()).toHaveTextContent('R$ 250,625.00')
    await openStage(2)
    const group = within(panel().getByRole('group', { name: t.stageGroup(2) }))
    expect(group.getByLabelText(t.extraCost)).toHaveValue('100.25')
  })

  test('modo meta com ponto: a meta em receita aceita "1500.50" e o investimento aparece com ponto', async () => {
    render(<App />)
    await choose(s.dot)
    await openStage(4)
    await replace(panel().getByLabelText(t.ticket), '100')
    await user().click(panel().getByRole('radio', { name: m.goal }))
    await user().selectOptions(panel().getByLabelText(t.goalTarget), t.revenueTarget)
    const goal = panel().getByLabelText(t.goalRevenue)
    await replace(goal, '1500.50')
    expect(goal).toHaveValue('1500.50')
    expect(goal).not.toHaveAttribute('aria-invalid')
    const inv = screen.getByRole('region', { name: f.investment })
    expect(inv.textContent).toMatch(/R\$ [\d,]+\.\d{2}/)
    expect(inv.textContent).not.toMatch(/R\$ [\d.]+,\d{2}/)
  })

  test('importar com ponto um arquivo antigo cujo campo tem ponto: o campo continua inválido', async () => {
    render(<App />)
    await choose(s.dot)
    const file = JSON.stringify({
      app: fx.fileApp,
      version: 1,
      name: 'Antigo',
      funnel: { ...initialForm(), unitCost: '1.5' },
    })
    await user().upload(screen.getByLabelText(fx.importFile), new File([file], 'Antigo.json', { type: 'application/json' }))
    expect(await screen.findByRole('button', { name: fx.menuButton('Antigo') })).toBeInTheDocument()
    const cost = panel().getByLabelText(t.unitCost)
    expect(cost).toHaveValue('1,5')
    expect(cost).toHaveAttribute('aria-invalid', 'true')
  })
})

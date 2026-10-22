import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { initialForm, type FunnelForm } from '../funnel/form'
import { formatConversion, formatMoney, formatVolume } from '../funnel/numbers'
import { saveLibrary } from '../funnels/storage'
import { texts } from '../texts'
import { SEPARATOR_STORAGE_KEY, loadSeparator, parseTyped } from './separator'

const s = texts.settings
const fx = texts.funnels
const t = texts.panel
const f = texts.funnel
const c = texts.compare

const user = () => userEvent.setup()
const gear = () => screen.getByRole('button', { name: s.open })
const modal = () => screen.getByRole('dialog', { name: s.title })
const panel = () => within(screen.getByRole('complementary', { name: t.label }))
const totals = () => screen.getByLabelText(f.totals.label)
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

function numberInputs() {
  return [...document.querySelectorAll<HTMLInputElement>('aside input[inputmode="decimal"]')]
}

describe('extra (rodada 2): separador', () => {
  test('valor salvo com outra grafia ("Ponto", "dot") vale como vírgula', () => {
    for (const value of ['Ponto', 'dot', ' ponto', '']) {
      const storage = { getItem: () => value } as unknown as Storage
      expect(loadSeparator(storage)).toBe('comma')
    }
    expect(SEPARATOR_STORAGE_KEY).toBe('analisador-de-funil:separador')
  })

  test('números grandes e pequenos com ponto', () => {
    expect(formatMoney(1234567.891, 'dot')).toBe('R$ 1,234,567.89')
    expect(formatMoney(0, 'dot')).toBe('R$ 0.00')
    expect(formatVolume(1234567, 'dot')).toBe('1,234,567')
    expect(formatConversion(0.125, 'dot')).toBe('0.125%')
    expect(formatConversion(100, 'dot')).toBe('100%')
    expect(parseTyped('1234567.89', 'dot')).toBe(1234567.89)
  })

  test('todos os modelos entram com ponto: nenhum campo numérico mostra vírgula', async () => {
    render(<App />)
    await choose(s.dot)
    for (const template of ['paidTraffic', 'ecommerce', 'b2b'] as const) {
      await user().click(screen.getByRole('button', { name: /^Funis salvos: / }))
      await user().click(menu().getByRole('button', { name: fx.newFunnel }))
      await user().click(menu().getByRole('button', { name: fx.templates[template] }))
      for (const input of numberInputs()) expect(input.value).not.toContain(',')
    }
  })

  test('duplicar com ponto mantém os números como digitados', async () => {
    seed([['Meu funil', { ...initialForm(), unitCost: '20,5' }]])
    await choose(s.dot)
    await user().click(menuButton('Meu funil'))
    await user().click(menu().getByRole('button', { name: fx.duplicate }))
    expect(panel().getByLabelText(t.unitCost)).toHaveValue('20.5')
    expect(totals()).toHaveTextContent('R$ 2,000.00')
  })

  test('com ponto, digitar "1.234,5" fica inválido e, de volta à vírgula, aparece "1,234.5" ainda inválido', async () => {
    render(<App />)
    await choose(s.dot)
    const budget = () => panel().getByLabelText(t.budget)
    await replace(budget(), '1.234,5')
    expect(budget()).toHaveAttribute('aria-invalid', 'true')
    await choose(s.comma)
    expect(budget()).toHaveValue('1,234.5')
    expect(budget()).toHaveAttribute('aria-invalid', 'true')
  })

  test('o que é digitado com ponto fica salvo no navegador e volta igual ao recarregar com ponto', async () => {
    const { unmount } = render(<App />)
    await choose(s.dot)
    await replace(panel().getByLabelText(t.budget), '1500.75')
    unmount()
    render(<App />)
    expect(panel().getByLabelText(t.budget)).toHaveValue('1500.75')
    expect(totals()).toHaveTextContent('R$ 1,500.75')
  })

  test('comparação com ponto: o valor comum com vírgula fica inválido', async () => {
    seed([
      ['A', initialForm()],
      ['B', { ...initialForm(), unitCost: '10' }],
    ])
    await choose(s.dot)
    await user().click(menuButton('A'))
    await user().click(menu().getByRole('button', { name: fx.compare }))
    await user().click(screen.getByRole('checkbox', { name: 'B' }))
    const region = within(screen.getByRole('region', { name: c.label }))
    const budget = region.getByLabelText(t.budget)
    await replace(budget, '2,000')
    expect(budget).toHaveAttribute('aria-invalid', 'true')
    await replace(budget, '2500.5')
    expect(budget).not.toHaveAttribute('aria-invalid')
    expect(screen.getByRole('table', { name: c.tableLabel })).toHaveTextContent('R$ 2,500.50')
  })

  test('o tema também troca pelas setas e vale na hora', async () => {
    render(<App />)
    await user().click(gear())
    expect(within(modal()).getByRole('radio', { name: s.dark })).toHaveFocus()
    await user().keyboard('{ArrowRight}')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  test('fora do modal os números das etapas recolhidas seguem o separador, e inválido mostra "—"', async () => {
    const form = initialForm()
    form.stages[2] = { ...form.stages[2], conversion: '12,5' }
    form.stages[3] = { ...form.stages[3], conversion: '1.5' }
    seed([['Meu funil', form]])
    await choose(s.dot)
    const stage = (n: number) => within(panel().getByRole('group', { name: t.stageGroup(n) }))
    expect(stage(3).getByText('12.5%')).toBeInTheDocument()
    // Stored "1.5" is invalid with a comma; it shows as "1,5" with a dot, still invalid.
    expect(stage(4).getByText(f.noValue)).toBeInTheDocument()
  })
})

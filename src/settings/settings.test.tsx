import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { initialForm, updateStage, type FunnelForm } from '../funnel/form'
import { saveLibrary } from '../funnels/storage'
import { texts } from '../texts'
import { SEPARATOR_STORAGE_KEY } from './separator'

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

function stage(n: number) {
  return panel().getByRole('group', { name: t.stageGroup(n) })
}
function toggle(n: number) {
  return within(stage(n))
    .getAllByRole('button')
    .find((b) => b.hasAttribute('aria-expanded'))!
}
function volumes() {
  return within(screen.getByRole('list', { name: f.listLabel }))
    .getAllByRole('listitem')
    .map((li) => li.querySelector('.funnel-band-volume')!.textContent)
}

async function selectFunnel(active: string, name: string) {
  await user().click(menuButton(active))
  await user().click(menu().getByRole('button', { name }))
}

describe('modal de configurações', () => {
  test('a engrenagem abre o modal com o título: o tema e, abaixo, o separador, com a vírgula marcada', async () => {
    render(<App />)
    expect(queryModal()).toBeNull()
    await user().click(gear())
    expect(modal()).toHaveAttribute('aria-modal', 'true')
    const groups = within(modal()).getAllByRole('group')
    expect(groups.map((g) => g.querySelector('legend')!.textContent)).toEqual([s.theme, s.separator])
    const comma = within(modal()).getByRole('radio', { name: s.comma })
    expect(comma).toBeChecked()
    expect(within(modal()).getByRole('radio', { name: s.dot })).not.toBeChecked()
  })

  test('ao abrir, o foco vai para a opção marcada do tema', async () => {
    render(<App />)
    await user().click(gear())
    expect(within(modal()).getByRole('radio', { name: s.dark })).toHaveFocus()
    await user().click(within(modal()).getByRole('radio', { name: s.light }))
    await user().click(within(modal()).getByRole('button', { name: s.close }))
    await user().click(gear())
    expect(within(modal()).getByRole('radio', { name: s.light })).toHaveFocus()
  })

  test('com o ponto escolhido, o ponto vem marcado ao abrir de novo', async () => {
    render(<App />)
    await choose(s.dot)
    await user().click(gear())
    expect(within(modal()).getByRole('radio', { name: s.dot })).toBeChecked()
  })

  test('Esc fecha, com o foco de volta na engrenagem', async () => {
    render(<App />)
    await user().click(gear())
    await user().keyboard('{Escape}')
    expect(queryModal()).toBeNull()
    expect(gear()).toHaveFocus()
  })

  test('"Fechar" fecha, com o foco de volta na engrenagem', async () => {
    render(<App />)
    await user().click(gear())
    await user().click(within(modal()).getByRole('button', { name: s.close }))
    expect(queryModal()).toBeNull()
    expect(gear()).toHaveFocus()
  })

  test('clicar no fundo escurecido fecha; clicar dentro do modal não', async () => {
    render(<App />)
    await user().click(gear())
    await user().click(within(modal()).getByRole('heading', { name: s.title }))
    expect(queryModal()).not.toBeNull()
    await user().click(modal().parentElement!)
    expect(queryModal()).toBeNull()
    expect(gear()).toHaveFocus()
  })

  test('o Tab e o Shift+Tab não saem do modal', async () => {
    render(<App />)
    await user().click(gear())
    for (let i = 0; i < 5; i++) {
      await user().tab()
      expect(modal()).toContainElement(document.activeElement as HTMLElement)
    }
    for (let i = 0; i < 5; i++) {
      await user().tab({ shift: true })
      expect(modal()).toContainElement(document.activeElement as HTMLElement)
    }
  })

  test('o modal tem só o botão "Fechar"', async () => {
    render(<App />)
    await user().click(gear())
    expect(within(modal()).getAllByRole('button').map((b) => b.textContent)).toEqual([s.close])
  })

  test('a escolha vale assim que é marcada, com o modal ainda aberto', async () => {
    render(<App />)
    await user().click(gear())
    await user().click(within(modal()).getByRole('radio', { name: s.dot }))
    expect(queryModal()).not.toBeNull()
    expect(totals()).toHaveTextContent('R$ 2,000.00')
  })
})

describe('trocar para ponto', () => {
  test('os campos, o funil, os resultados e o resumo da etapa recolhida mudam na hora', async () => {
    seed([['Meu funil', { ...initialForm(), unitCost: '20,5', budget: '2050' }]])
    await choose(s.dot)
    expect(panel().getByLabelText(t.unitCost)).toHaveValue('20.5')
    expect(panel().getByLabelText(t.budget)).toHaveValue('2050')
    expect(totals()).toHaveTextContent('R$ 2,050.00')
    expect(volumes()).toEqual(['100,000', '2,500', '300', '45'])
    expect(screen.getByRole('list', { name: f.listLabel })).toHaveTextContent('R$ 20.50 CPM')
    expect(screen.getByRole('list', { name: f.listLabel })).toHaveTextContent('2.5%')
    expect(within(stage(2)).getByText('2.5%')).toBeInTheDocument()
    await user().click(toggle(2))
    expect(within(stage(2)).getByLabelText(t.conversion)).toHaveValue('2.5')
  })

  test('voltar para vírgula desfaz a troca', async () => {
    seed([['Meu funil', { ...initialForm(), unitCost: '20,5' }]])
    await choose(s.dot)
    await choose(s.comma)
    expect(panel().getByLabelText(t.unitCost)).toHaveValue('20,5')
    expect(totals()).toHaveTextContent('R$ 2.000,00')
  })

  test('os outros funis salvos aparecem convertidos, inclusive campos inválidos; nomes não mudam', async () => {
    const sample = initialForm()
    const other = { ...updateStage(sample, sample.stages[0].id, { name: 'Etapa 1,5' }), budget: '2.000' }
    seed([
      ['Meu funil', initialForm()],
      ['Cenário 1,5', other],
    ])
    await choose(s.dot)
    await selectFunnel('Meu funil', 'Cenário 1,5')
    expect(menuButton('Cenário 1,5')).toBeInTheDocument()
    expect(panel().getByLabelText(t.budget)).toHaveValue('2,000')
    expect(panel().getByLabelText(t.budget)).toHaveAttribute('aria-invalid', 'true')
    expect(within(stage(1)).getByLabelText(t.name)).toHaveValue('Etapa 1,5')
  })

  test('com ponto, "1,5" deixa o campo inválido e "1.5" vale', async () => {
    render(<App />)
    await choose(s.dot)
    const cost = panel().getByLabelText(t.unitCost)
    await replace(cost, '1,5')
    expect(cost).toHaveValue('1,5')
    expect(cost).toHaveAttribute('aria-invalid', 'true')
    await replace(cost, '1.5')
    expect(cost).toHaveValue('1.5')
    expect(cost).not.toHaveAttribute('aria-invalid')
    expect(screen.getByRole('list', { name: f.listLabel })).toHaveTextContent('R$ 1.50 CPM')
  })

  test('um modelo criado com ponto entra com os números com ponto', async () => {
    render(<App />)
    await choose(s.dot)
    await user().click(menuButton(fx.firstName))
    await user().click(menu().getByRole('button', { name: fx.newFunnel }))
    await user().click(menu().getByRole('button', { name: fx.templates.paidTraffic }))
    expect(panel().getByLabelText(t.unitCost)).toHaveValue('1.50')
    expect(totals()).toHaveTextContent('R$ 3,000.00')
  })

  test('importar com ponto mostra os campos com ponto', async () => {
    render(<App />)
    await choose(s.dot)
    const file = JSON.stringify({
      app: fx.fileApp,
      version: 1,
      name: 'Importado',
      funnel: { ...initialForm(), unitCost: '1,25' },
    })
    await user().upload(screen.getByLabelText(fx.importFile), new File([file], 'Importado.json', { type: 'application/json' }))
    expect(await screen.findByRole('button', { name: fx.menuButton('Importado') })).toBeInTheDocument()
    expect(panel().getByLabelText(t.unitCost)).toHaveValue('1.25')
  })

  test('a escolha é gravada no navegador', async () => {
    render(<App />)
    await choose(s.dot)
    expect(localStorage.getItem(SEPARATOR_STORAGE_KEY)).toBe('ponto')
  })

  test('um ponto salvo vale ao abrir o app', () => {
    localStorage.setItem(SEPARATOR_STORAGE_KEY, 'ponto')
    seed([['Meu funil', { ...initialForm(), unitCost: '20,5' }]])
    expect(panel().getByLabelText(t.unitCost)).toHaveValue('20.5')
    expect(totals()).toHaveTextContent('R$ 2,000.00')
  })

  describe('com o armazenamento bloqueado', () => {
    afterEach(() => vi.restoreAllMocks())

    test('a troca funciona na sessão', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      render(<App />)
      await choose(s.dot)
      expect(totals()).toHaveTextContent('R$ 2,000.00')
    })
  })
})

describe('na comparação', () => {
  test('o modal abre, e o ponto converte o valor comum e a tabela', async () => {
    seed([
      ['A', { ...initialForm(), budget: '2000,5' }],
      ['B', { ...initialForm(), unitCost: '10' }],
    ])
    await user().click(menuButton('A'))
    await user().click(menu().getByRole('button', { name: fx.compare }))
    await user().click(screen.getByRole('checkbox', { name: 'B' }))
    const region = within(screen.getByRole('region', { name: c.label }))
    expect(region.getByLabelText(t.budget)).toHaveValue('2000,5')

    await choose(s.dot)
    expect(region.getByLabelText(t.budget)).toHaveValue('2000.5')
    const table = within(screen.getByRole('table', { name: c.tableLabel }))
    const media = within(table.getByRole('rowheader', { name: f.totals.media }).closest('tr')!)
    expect(media.getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['R$ 2,000.50', 'R$ 2,000.50'])
    expect(screen.getByRole('region', { name: c.columnLabel('B') })).toHaveTextContent('200,050')

    await user().click(gear())
    await user().keyboard('{Escape}')
    expect(queryModal()).toBeNull()
    expect(gear()).toHaveFocus()
    await user().click(gear())
    for (let i = 0; i < 3; i++) {
      await user().tab()
      expect(modal()).toContainElement(document.activeElement as HTMLElement)
    }
    await user().click(modal().parentElement!)
    expect(queryModal()).toBeNull()
    expect(gear()).toHaveFocus()
    expect(screen.getByRole('region', { name: c.label })).toBeInTheDocument()

    await replace(region.getByLabelText(t.budget), '3000.25')
    expect(media.getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['R$ 3,000.25', 'R$ 3,000.25'])
    await choose(s.comma)
    expect(region.getByLabelText(t.budget)).toHaveValue('3000,25')
  })
})

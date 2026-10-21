import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { initialForm, setMode, updateStage, type FunnelForm } from '../funnel/form'
import { saveLibrary } from '../funnels/storage'
import { templateForm } from '../funnels/templates'
import { texts } from '../texts'

const c = texts.compare
const fx = texts.funnels
const t = texts.panel
const f = texts.funnel

// Scenarios of the sample funnel (Impressões → Cliques → Leads → Vendas), plus incompatible ones.
const withConversion = (form: FunnelForm, i: number, conversion: string) =>
  updateStage(form, form.stages[i].id, { conversion })
const base = () => initialForm() // volumes 100.000 / 2.500 / 300 / 45
const moreLeads = () => ({ ...withConversion(initialForm(), 2, '24'), budget: '3000' }) // own budget differs
const cheaper = () => ({ ...initialForm(), unitCost: '10' })
const fourth = () => withConversion(initialForm(), 3, '30')
const b2b = () => templateForm('b2b')
const shorter = () => ({ ...initialForm(), stages: initialForm().stages.slice(0, 3) })

function seed(funnels: [string, FunnelForm][], active = funnels[0][0]) {
  saveLibrary(
    { activeId: active, funnels: funnels.map(([name, form]) => ({ id: name, name, form })) },
    localStorage,
  )
  render(<App />)
}

const user = () => userEvent.setup()
const menuButton = (name: string) => screen.getByRole('button', { name: fx.menuButton(name) })
const menu = () => within(screen.getByRole('dialog', { name: fx.menuLabel }))
const comparison = () => screen.queryByRole('region', { name: c.label })
const cmp = () => within(screen.getByRole('region', { name: c.label }))
const choice = (name: string) => within(screen.getByRole('group', { name: c.selectionLabel })).getByRole('checkbox', { name })
const column = (name: string) => within(screen.getByRole('region', { name: c.columnLabel(name) }))
const columnRegion = (name: string) => screen.getByRole('region', { name: c.columnLabel(name) })
const panel = () => within(screen.getByRole('complementary', { name: t.label }))

function bandNames(name: string) {
  return column(name)
    .getAllByRole('listitem')
    .map((li) => li.querySelector('.funnel-band-name')!.textContent)
}
function volumes(name: string) {
  return column(name)
    .getAllByRole('listitem')
    .map((li) => li.querySelector('.funnel-band-volume')!.textContent)
}

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

function stage(n: number) {
  const group = panel().getByRole('group', { name: t.stageGroup(n) })
  const toggle = group.querySelector<HTMLElement>('[aria-expanded="false"]')
  if (toggle) fireEvent.click(toggle)
  return within(group)
}

describe('entrar, escolher e sair', () => {
  test('"Comparar" abre a escolha com o ativo marcado; com 2 marcados aparece a comparação', async () => {
    seed([['Base', base()], ['Mais leads', moreLeads()]])
    await menuAction('Base', fx.compare)
    expect(choice('Base')).toBeChecked()
    expect(screen.queryByRole('table', { name: c.tableLabel })).toBeNull()
    expect(cmp().getByText(c.pickMore)).toBeInTheDocument()

    await user().click(choice('Mais leads'))
    expect(screen.getByRole('table', { name: c.tableLabel })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: f.label })).toBeNull()
  })

  test('"Voltar ao funil" volta ao funil ativo', async () => {
    seed([['Base', base()], ['Mais leads', moreLeads()]])
    await compare('Base', 'Mais leads')
    await user().click(cmp().getByRole('button', { name: c.back }))
    expect(comparison()).toBeNull()
    expect(screen.getByRole('region', { name: f.label })).toBeInTheDocument()
    expect(menuButton('Base')).toBeInTheDocument()
  })

  test('os incompatíveis ficam desabilitados, com o motivo', async () => {
    seed([['Base', base()], ['B2B', b2b()], ['Curto', shorter()], ['Mais leads', moreLeads()]])
    await menuAction('Base', fx.compare)
    expect(choice('B2B')).toBeDisabled()
    expect(choice('B2B')).toHaveAccessibleDescription(c.differentStages)
    expect(choice('Curto')).toBeDisabled()
    expect(choice('Curto')).toHaveAccessibleDescription(c.differentCount)
    expect(choice('Mais leads')).toBeEnabled()
  })

  test('sem nenhum compatível, aparece a dica para duplicar', async () => {
    seed([['Base', base()], ['B2B', b2b()]])
    await menuAction('Base', fx.compare)
    expect(cmp().getByText(c.duplicateHint)).toBeInTheDocument()
  })

  test('com 3 marcados, os outros ficam desabilitados com "Máximo de 3 funis"', async () => {
    seed([['Base', base()], ['Mais leads', moreLeads()], ['Barato', cheaper()], ['Quarto', fourth()]])
    await compare('Base', 'Mais leads', 'Barato')
    expect(choice('Quarto')).toBeDisabled()
    expect(choice('Quarto')).toHaveAccessibleDescription(c.max)
    await user().click(choice('Barato'))
    expect(choice('Quarto')).toBeEnabled()
  })

  test('recarregar volta ao funil ativo, sem comparação', async () => {
    seed([['Base', base()], ['Mais leads', moreLeads()]])
    await compare('Base', 'Mais leads')
    screen.getByRole('table', { name: c.tableLabel })
    // A new render reads what was saved, like a reload.
    cleanup()
    render(<App />)
    expect(comparison()).toBeNull()
    expect(menuButton('Base')).toBeInTheDocument()
  })
})

describe('colunas e tabela', () => {
  test('cada coluna mostra o nome do funil e as faixas dele', async () => {
    seed([['Base', base()], ['Mais leads', moreLeads()]])
    await compare('Base', 'Mais leads')
    expect(columnRegion('Base')).toHaveTextContent('Base')
    expect(bandNames('Base')).toEqual(['Impressões', 'Cliques', 'Leads', 'Vendas'])
    expect(volumes('Base')).toEqual(['100.000', '2.500', '300', '45'])
    expect(volumes('Mais leads')).toEqual(['100.000', '2.500', '600', '90'])
  })

  test('a tabela destaca o melhor valor de cada linha', async () => {
    seed([['Base', base()], ['Mais leads', moreLeads()]])
    await compare('Base', 'Mais leads')
    expect(tableRow(c.volumeRow('Vendas'))).toEqual(['45', `90 ${c.best}`])
    expect(tableRow(c.costRow('Vendas'))).toEqual(['R$ 44,44', `R$ 22,22 ${c.best}`])
    // Same budget for both: nothing stands out.
    expect(tableRow(f.totals.media)).toEqual(['R$ 2.000,00', 'R$ 2.000,00'])
  })

  test('funil inválido ou com meta impossível: aviso na coluna e "—" na tabela', async () => {
    const invalid = withConversion(base(), 1, 'x')
    seed([['Base', base()], ['Quebrado', invalid]])
    await compare('Base', 'Quebrado')
    expect(columnRegion('Quebrado')).toHaveTextContent(f.fixFields)
    expect(tableRow(c.volumeRow('Vendas'))).toEqual(['45', f.noValue])

    const impossible = withConversion(base(), 2, '0')
    cleanup()
    localStorage.clear()
    seed([['Base', setMode(base(), 'goal', 45)], ['Sem leads', impossible]])
    await compare('Base', 'Sem leads')
    expect(columnRegion('Sem leads')).toHaveTextContent(f.impossible)
    expect(tableRow(f.totals.media)[1]).toBe(f.noValue)
  })
})

describe('modo e valor comum', () => {
  test('começam pelo funil ativo', async () => {
    let active = setMode(base(), 'goal', 45)
    active = { ...active, goal: '90' }
    seed([['Base', active], ['Mais leads', moreLeads()]])
    await compare('Base', 'Mais leads')
    expect(cmp().getByRole('radio', { name: texts.mode.goal })).toBeChecked()
    expect(cmp().getByRole('checkbox', { name: c.sameValue })).toBeChecked()
    expect(cmp().getByLabelText(t.goalQuantity)).toHaveValue('90')
    expect(cmp().getByLabelText(t.goalTarget)).toHaveDisplayValue('Vendas')
    expect(volumes('Base')[3]).toBe('90')
    expect(volumes('Mais leads')[3]).toBe('90')
  })

  test('mudar o valor comum muda todos os funis e não altera nenhum funil salvo', async () => {
    seed([['Base', base()], ['Mais leads', moreLeads()]])
    await compare('Base', 'Mais leads')
    const budget = cmp().getByLabelText(t.budget)
    expect(budget).toHaveValue('2000')
    await user().clear(budget)
    await user().type(budget, '4000')
    expect(volumes('Base')[0]).toBe('200.000')
    expect(volumes('Mais leads')[0]).toBe('200.000')

    await user().click(cmp().getByRole('button', { name: c.back }))
    expect(panel().getByLabelText(t.budget)).toHaveValue('2000')
  })

  test('desligado, cada funil usa o próprio valor', async () => {
    seed([['Base', base()], ['Mais leads', moreLeads()]])
    await compare('Base', 'Mais leads')
    await user().click(cmp().getByRole('checkbox', { name: c.sameValue }))
    expect(cmp().queryByLabelText(t.budget)).toBeNull()
    expect(tableRow(f.totals.media)).toEqual([`R$ 2.000,00 ${c.best}`, 'R$ 3.000,00'])
  })
})

describe('editar durante a comparação', () => {
  test('clicar numa faixa de outro funil: ele vira o ativo e a barra abre nele, na etapa clicada', async () => {
    seed([['Base', base()], ['Mais leads', moreLeads()]])
    await compare('Base', 'Mais leads')
    expect(columnRegion('Base')).toHaveAttribute('aria-current', 'true')

    await user().click(column('Mais leads').getByRole('button', { name: f.editStage('Leads') }))
    expect(menuButton('Mais leads')).toBeInTheDocument()
    expect(columnRegion('Mais leads')).toHaveAttribute('aria-current', 'true')
    expect(columnRegion('Base')).not.toHaveAttribute('aria-current')
    expect(stage(3).getByLabelText(t.name)).toHaveFocus()
    expect(stage(3).getByLabelText(t.conversion)).toHaveValue('24')
    expect(panel().queryByRole('radio', { name: texts.mode.budget })).toBeNull()
    expect(panel().getByText(c.structureNotice)).toBeInTheDocument()
  })

  test('mudar uma conversão muda só aquele funil', async () => {
    seed([['Base', base()], ['Mais leads', moreLeads()]])
    await compare('Base', 'Mais leads')
    await user().click(column('Base').getByRole('button', { name: f.editConversion('Leads') }))
    const conversion = stage(3).getByLabelText(t.conversion)
    await user().clear(conversion)
    await user().type(conversion, '6')
    expect(volumes('Base')[2]).toBe('150')
    expect(volumes('Mais leads')[2]).toBe('600')
  })

  test('renomear, adicionar, remover e reordenar mudam todos os comparados, e fica salvo', async () => {
    seed([['Base', base()], ['Mais leads', moreLeads()]])
    await compare('Base', 'Mais leads')
    await user().click(column('Base').getByRole('button', { name: f.editStage('Leads') }))

    const name = stage(3).getByLabelText(t.name)
    await user().clear(name)
    await user().type(name, 'Contatos')
    expect(bandNames('Mais leads')[2]).toBe('Contatos')

    await user().click(panel().getByRole('button', { name: t.addStage }))
    expect(bandNames('Base')).toEqual(['Impressões', 'Cliques', 'Contatos', 'Vendas', 'Etapa 5'])
    expect(bandNames('Mais leads')).toEqual(bandNames('Base'))

    const second = panel().getByRole('group', { name: t.stageGroup(2) })
    await user().click(within(second).getByRole('button', { name: t.remove }))
    expect(within(second).getByText(c.confirmRemoveAll)).toBeInTheDocument()
    await user().click(within(second).getByRole('button', { name: t.yes }))
    expect(bandNames('Mais leads')).toEqual(['Impressões', 'Contatos', 'Vendas', 'Etapa 5'])

    const last = panel().getByRole('group', { name: t.stageGroup(4) })
    await user().click(within(last).getByRole('button', { name: t.moveUp }))
    expect(bandNames('Base')).toEqual(['Impressões', 'Contatos', 'Etapa 5', 'Vendas'])
    expect(bandNames('Mais leads')).toEqual(bandNames('Base'))
    // Each stage keeps its own numbers: "Mais leads" still converts 24% into Contatos.
    expect(volumes('Mais leads')[1]).toBe('24.000')

    cleanup()
    render(<App />)
    await menuAction('Base', 'Mais leads')
    const list = screen.getByRole('list', { name: f.listLabel })
    expect(within(list).getAllByRole('listitem').map((li) => li.querySelector('.funnel-band-name')!.textContent)).toEqual([
      'Impressões',
      'Contatos',
      'Etapa 5',
      'Vendas',
    ])
  })

  test('verba na barra: escondida com o valor comum; desligado, aparece com o valor do próprio funil', async () => {
    seed([['Base', base()], ['Mais leads', moreLeads()]])
    await compare('Base', 'Mais leads')
    await user().click(column('Mais leads').getByRole('button', { name: f.editStage('Leads') }))
    expect(panel().queryByLabelText(t.budget)).toBeNull()

    await user().click(cmp().getByRole('checkbox', { name: c.sameValue }))
    const own = panel().getByLabelText(t.budget)
    expect(own).toHaveValue('3000')
    await user().clear(own)
    await user().type(own, '4000')
    expect(tableRow(f.totals.media)[1]).toBe('R$ 4.000,00')
  })

  test('desmarcar o funil ativo torna ativo o primeiro marcado', async () => {
    seed([['Base', base()], ['Mais leads', moreLeads()], ['Barato', cheaper()]])
    await compare('Base', 'Mais leads', 'Barato')
    await user().click(choice('Base'))
    expect(menuButton('Mais leads')).toBeInTheDocument()
    expect(columnRegion('Mais leads')).toHaveAttribute('aria-current', 'true')
  })
})

describe('menu de funis durante a comparação', () => {
  test('trocar para um funil comparado o torna ativo e mantém a comparação', async () => {
    seed([['Base', base()], ['Mais leads', moreLeads()]])
    await compare('Base', 'Mais leads')
    await menuAction('Base', 'Mais leads')
    expect(menuButton('Mais leads')).toBeInTheDocument()
    expect(comparison()).not.toBeNull()
  })

  test('trocar para outro funil sai da comparação', async () => {
    seed([['Base', base()], ['Mais leads', moreLeads()], ['B2B', b2b()]])
    await compare('Base', 'Mais leads')
    await menuAction('Base', 'B2B')
    expect(comparison()).toBeNull()
    expect(menuButton('B2B')).toBeInTheDocument()
  })

  test('Novo, Duplicar e Importar saem da comparação', async () => {
    seed([['Base', base()], ['Mais leads', moreLeads()]])
    await compare('Base', 'Mais leads')
    await menuAction('Base', fx.duplicate)
    expect(comparison()).toBeNull()

    await compare('Base (cópia)', 'Base')
    await menuAction('Base (cópia)', fx.newFunnel)
    await user().click(menu().getByRole('button', { name: fx.templates.b2b }))
    expect(comparison()).toBeNull()
  })

  test('Renomear mantém a comparação', async () => {
    seed([['Base', base()], ['Mais leads', moreLeads()]])
    await compare('Base', 'Mais leads')
    await menuAction('Base', fx.rename)
    await user().keyboard('Atual{Enter}')
    expect(comparison()).not.toBeNull()
    expect(columnRegion('Atual')).toBeInTheDocument()
  })

  test('apagar o ativo tira ele da comparação; com só 1 marcado, volta a escolha', async () => {
    seed([['Base', base()], ['Mais leads', moreLeads()], ['Barato', cheaper()]])
    await compare('Base', 'Mais leads', 'Barato')
    await menuAction('Base', fx.remove)
    await user().click(menu().getByRole('button', { name: fx.yes }))
    expect(screen.queryByRole('region', { name: c.columnLabel('Base') })).toBeNull()
    expect(columnRegion('Mais leads')).toBeInTheDocument()
    expect(menuButton('Mais leads')).toBeInTheDocument()

    await menuAction('Mais leads', fx.remove)
    await user().click(menu().getByRole('button', { name: fx.yes }))
    expect(comparison()).not.toBeNull()
    expect(screen.queryByRole('table', { name: c.tableLabel })).toBeNull()
    expect(choice('Barato')).toBeChecked()
  })
})

describe('decisões depois do tester', () => {
  const goalBase = () => ({ ...setMode(base(), 'goal', 45), goal: '90' })

  test('"Meta em" comum segue a etapa ao reordenar', async () => {
    seed([['Base', goalBase()], ['Mais leads', moreLeads()]])
    await compare('Base', 'Mais leads')
    expect(cmp().getByLabelText(t.goalTarget)).toHaveDisplayValue('Vendas')
    await user().click(column('Base').getByRole('button', { name: f.editStage('Vendas') }))
    await user().click(panel().getByRole('group', { name: t.stageGroup(4) }).querySelector<HTMLElement>(`[aria-label="${t.moveUp}"]`)!)
    expect(cmp().getByLabelText(t.goalTarget)).toHaveDisplayValue('Vendas')
    expect(volumes('Base')[2]).toBe('90')
  })

  test('com nenhum marcado, o funil que for marcado vira o ativo', async () => {
    seed([['Base', base()], ['Mais leads', moreLeads()]])
    await menuAction('Base', fx.compare)
    await user().click(choice('Base'))
    await user().click(choice('Mais leads'))
    expect(menuButton('Mais leads')).toBeInTheDocument()
  })

  test('"Comparar" fica desabilitado durante a comparação', async () => {
    seed([['Base', base()], ['Mais leads', moreLeads()]])
    await compare('Base', 'Mais leads')
    await user().click(menuButton('Base'))
    expect(menu().getByRole('button', { name: fx.compare })).toBeDisabled()
  })
})

describe('foco ao abrir a barra pelo botão durante a comparação', () => {
  test('com o valor comum: no nome da etapa aberta', async () => {
    seed([['Base', base()], ['Mais leads', moreLeads()]])
    await compare('Base', 'Mais leads')
    await user().click(screen.getByRole('button', { name: texts.sidebar.close }))
    await user().click(screen.getByRole('button', { name: texts.sidebar.open }))
    expect(stage(1).getByLabelText(t.name)).toHaveFocus()
  })

  test('sem o valor comum: no valor que a barra mostra', async () => {
    seed([['Base', base()], ['Mais leads', moreLeads()]])
    await compare('Base', 'Mais leads')
    await user().click(cmp().getByRole('checkbox', { name: c.sameValue }))
    await user().click(cmp().getByRole('radio', { name: texts.mode.goal }))
    await user().click(screen.getByRole('button', { name: texts.sidebar.close }))
    await user().click(screen.getByRole('button', { name: texts.sidebar.open }))
    expect(panel().getByLabelText(t.goalQuantity)).toHaveFocus()
  })
})

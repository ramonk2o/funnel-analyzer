import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { initialForm, setMode, updateStage, type FunnelForm } from '../funnel/form'
import { saveLibrary } from './storage'
import { texts } from '../texts'

const fx = texts.funnels
const t = texts.panel

const menuButton = (name: string) => screen.getByRole('button', { name: fx.menuButton(name) })
const menu = () => within(screen.getByRole('dialog', { name: fx.menuLabel }))
const listed = () => menu().getAllByRole('button', { name: /.*/ }).filter((b) => b.closest('ul'))
const listedNames = () => listed().map((b) => b.textContent)
const budget = () => screen.getByLabelText(t.budget)

function bandNames() {
  const list = screen.getByRole('list', { name: texts.funnel.listLabel })
  return within(list)
    .getAllByRole('listitem')
    .map((b) => b.querySelector('.funnel-band-name')!.textContent)
}

async function openMenu(name: string) {
  await userEvent.setup().click(menuButton(name))
  return menu()
}

async function replace(input: HTMLElement, value: string) {
  const user = userEvent.setup()
  await user.clear(input)
  if (value) await user.type(input, value)
}

async function newFromTemplate(activeName: string, template: string) {
  const user = userEvent.setup()
  await openMenu(activeName)
  await user.click(menu().getByRole('button', { name: fx.newFunnel }))
  await user.click(menu().getByRole('button', { name: template }))
}

test('o cabeçalho mostra o funil ativo, e o menu lista os funis com o ativo marcado', async () => {
  render(<App />)
  await openMenu(fx.firstName)
  expect(listedNames()).toEqual([fx.firstName])
  expect(listed()[0]).toHaveAttribute('aria-current', 'true')
})

test('novo funil de um modelo: vira o ativo e entra no fim da lista', async () => {
  render(<App />)
  await newFromTemplate(fx.firstName, fx.templates.ecommerce)
  expect(menuButton(fx.templates.ecommerce)).toBeInTheDocument()
  expect(bandNames()).toEqual(['Impressões', 'Cliques', 'Carrinho', 'Compra'])

  await newFromTemplate(fx.templates.ecommerce, fx.templates.blank)
  expect(menuButton('Funil 1')).toBeInTheDocument()
  await openMenu('Funil 1')
  expect(listedNames()).toEqual([fx.firstName, fx.templates.ecommerce, 'Funil 1'])
  expect(listed()[2]).toHaveAttribute('aria-current', 'true')
})

test('modelo com nome repetido ganha "(2)"', async () => {
  render(<App />)
  await newFromTemplate(fx.firstName, fx.templates.b2b)
  await newFromTemplate(fx.templates.b2b, fx.templates.b2b)
  expect(menuButton(`${fx.templates.b2b} (2)`)).toBeInTheDocument()
})

test('trocar de funil pela lista mostra as etapas e os valores do outro', async () => {
  const user = userEvent.setup()
  render(<App />)
  await newFromTemplate(fx.firstName, fx.templates.b2b)
  expect(budget()).toHaveValue('10000')

  await openMenu(fx.templates.b2b)
  await user.click(menu().getByRole('button', { name: fx.firstName }))
  expect(menuButton(fx.firstName)).toBeInTheDocument()
  expect(budget()).toHaveValue('2000')
  expect(bandNames()).toEqual(['Impressões', 'Cliques', 'Leads', 'Vendas'])
})

test('duplicar cria "(cópia)" com o mesmo conteúdo, ativo; mexer nela não muda o original', async () => {
  const user = userEvent.setup()
  render(<App />)
  await replace(budget(), '3000')
  await openMenu(fx.firstName)
  await user.click(menu().getByRole('button', { name: fx.duplicate }))

  const copy = `${fx.firstName} (cópia)`
  expect(menuButton(copy)).toBeInTheDocument()
  expect(budget()).toHaveValue('3000')
  await replace(budget(), '9000')

  await openMenu(copy)
  await user.click(menu().getByRole('button', { name: fx.firstName }))
  expect(budget()).toHaveValue('3000')
})

describe('renomear', () => {
  async function startRename() {
    await openMenu(fx.firstName)
    await userEvent.setup().click(menu().getByRole('button', { name: fx.rename }))
    return screen.getByRole('textbox', { name: fx.renameLabel })
  }

  test('o nome vira um campo de texto já selecionado', async () => {
    render(<App />)
    const input = (await startRename()) as HTMLInputElement
    expect(input).toHaveFocus()
    expect(input).toHaveValue(fx.firstName)
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, fx.firstName.length])
  })

  test('Enter confirma', async () => {
    render(<App />)
    await startRename()
    await userEvent.setup().keyboard('Natal{Enter}')
    expect(menuButton('Natal')).toBeInTheDocument()
  })

  test('clicar fora confirma', async () => {
    const user = userEvent.setup()
    render(<App />)
    await startRename()
    await user.keyboard('Natal')
    await user.click(document.body)
    expect(menuButton('Natal')).toBeInTheDocument()
  })

  test('Esc cancela', async () => {
    render(<App />)
    await startRename()
    await userEvent.setup().keyboard('Natal{Escape}')
    expect(menuButton(fx.firstName)).toBeInTheDocument()
  })

  test('vazio volta ao nome anterior', async () => {
    render(<App />)
    await startRename()
    await userEvent.setup().keyboard('{Backspace}{Enter}')
    expect(menuButton(fx.firstName)).toBeInTheDocument()
  })

  test('nome repetido é aceito', async () => {
    render(<App />)
    await newFromTemplate(fx.firstName, fx.templates.b2b)
    await openMenu(fx.templates.b2b)
    await userEvent.setup().click(menu().getByRole('button', { name: fx.rename }))
    await userEvent.setup().keyboard(`${fx.firstName}{Enter}`)
    await openMenu(fx.firstName)
    expect(listedNames()).toEqual([fx.firstName, fx.firstName])
  })
})

describe('apagar', () => {
  test('com um só funil, "Apagar" fica desabilitado', async () => {
    render(<App />)
    await openMenu(fx.firstName)
    expect(menu().getByRole('button', { name: fx.remove })).toBeDisabled()
  })

  test('pede confirmação no próprio menu; "Não" mantém o funil', async () => {
    const user = userEvent.setup()
    render(<App />)
    await newFromTemplate(fx.firstName, fx.templates.b2b)
    await openMenu(fx.templates.b2b)
    await user.click(menu().getByRole('button', { name: fx.remove }))
    expect(menu().getByText(fx.confirmRemove(fx.templates.b2b))).toBeInTheDocument()
    await user.click(menu().getByRole('button', { name: fx.no }))
    expect(menu().queryByText(fx.confirmRemove(fx.templates.b2b))).toBeNull()
    expect(listedNames()).toEqual([fx.firstName, fx.templates.b2b])
    expect(menuButton(fx.templates.b2b)).toBeInTheDocument()
  })

  test('"Sim" apaga e torna ativo o primeiro da lista', async () => {
    const user = userEvent.setup()
    render(<App />)
    await newFromTemplate(fx.firstName, fx.templates.b2b)
    await newFromTemplate(fx.templates.b2b, fx.templates.ecommerce)
    await openMenu(fx.templates.ecommerce)
    await user.click(menu().getByRole('button', { name: fx.templates.b2b }))
    await openMenu(fx.templates.b2b)
    await user.click(menu().getByRole('button', { name: fx.remove }))
    await user.click(menu().getByRole('button', { name: fx.yes }))

    expect(menuButton(fx.firstName)).toBeInTheDocument()
    expect(budget()).toHaveValue('2000')
    await openMenu(fx.firstName)
    expect(listedNames()).toEqual([fx.firstName, fx.templates.ecommerce])
  })
})

test('ao reabrir um funil com campo inválido, o funil dá lugar ao aviso; corrigir traz o funil de volta', async () => {
  const first = render(<App />)
  await replace(budget(), 'abc')
  first.unmount()

  render(<App />)
  expect(screen.getByText(texts.funnel.fixFields)).toBeInTheDocument()
  expect(screen.queryByRole('list', { name: texts.funnel.listLabel })).toBeNull()
  expect(budget()).toHaveValue('abc')
  expect(budget()).toHaveAttribute('aria-invalid', 'true')

  await replace(budget(), '2000')
  expect(screen.queryByText(texts.funnel.fixFields)).toBeNull()
  expect(bandNames()).toEqual(['Impressões', 'Cliques', 'Leads', 'Vendas'])
})

test('o modelo em branco abre com o aviso até ser preenchido', async () => {
  render(<App />)
  await newFromTemplate(fx.firstName, fx.templates.blank)
  expect(screen.getByText(texts.funnel.fixFields)).toBeInTheDocument()
})

test('importar um arquivo inválido mostra o erro e não cria funil', async () => {
  const user = userEvent.setup()
  render(<App />)
  const file = new File(['oi'], 'funil.json', { type: 'application/json' })
  await user.upload(screen.getByLabelText(fx.importFile), file)
  expect(await screen.findByText(fx.invalidFile)).toBeInTheDocument()
  await openMenu(fx.firstName)
  expect(listedNames()).toEqual([fx.firstName])
})

describe('armazenamento', () => {
  afterEach(() => vi.restoreAllMocks())

  test('bloqueado: o app funciona e avisa que os funis não estão sendo salvos', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    render(<App />)
    expect(screen.getByText(fx.notSaved)).toBeInTheDocument()
    await replace(budget(), '4000')
    expect(bandNames()).toEqual(['Impressões', 'Cliques', 'Leads', 'Vendas'])
    expect(screen.getByLabelText(texts.funnel.totals.label)).toHaveTextContent('R$ 4.000,00')
  })

  test('falha ao salvar: o aviso aparece', async () => {
    render(<App />)
    expect(screen.queryByText(fx.notSaved)).toBeNull()
    const setItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === fx.storageKey) throw new DOMException('full', 'QuotaExceededError')
      setItem.call(this, key, value)
    })
    fireEvent.change(budget(), { target: { value: '4000' } })
    expect(screen.getByText(fx.notSaved)).toBeInTheDocument()
  })
})

describe('decisões depois do tester', () => {
  afterEach(() => vi.restoreAllMocks())

  function saveOne(form: FunnelForm) {
    saveLibrary({ activeId: 'a', funnels: [{ id: 'a', name: fx.firstName, form }] }, localStorage)
  }

  test('funil válido com meta impossível ao abrir: no lugar do funil, "Meta impossível com estes valores"', () => {
    let form = setMode(initialForm(), 'goal', 45)
    form = updateStage(form, form.stages[1].id, { conversion: '0' })
    saveOne(form)
    render(<App />)
    expect(screen.queryByRole('list', { name: texts.funnel.listLabel })).toBeNull()
    expect(screen.getByRole('region', { name: texts.funnel.label })).toHaveTextContent(texts.funnel.impossible)
  })

  test('passar para o modo meta sem cálculo anterior: a meta começa em 1', async () => {
    saveOne({ ...initialForm(), budget: 'abc' })
    render(<App />)
    await userEvent.setup().click(screen.getByRole('radio', { name: texts.mode.goal }))
    expect(screen.getByLabelText(t.goalQuantity)).toHaveValue('1')
  })

  test('voltar pela lista a um funil com campo inválido mostra o aviso de correção', async () => {
    const user = userEvent.setup()
    render(<App />)
    await replace(budget(), 'abc')
    await newFromTemplate(fx.firstName, fx.templates.b2b)
    await openMenu(fx.templates.b2b)
    await user.click(menu().getByRole('button', { name: fx.firstName }))
    expect(screen.getByText(texts.funnel.fixFields)).toBeInTheDocument()
  })

  test('o aviso de "não salvo" some quando uma gravação seguinte dá certo', () => {
    render(<App />)
    const setItem = Storage.prototype.setItem
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    fireEvent.change(budget(), { target: { value: '4000' } })
    expect(screen.getByText(fx.notSaved)).toBeInTheDocument()
    spy.mockImplementation(function (this: Storage, key, value) {
      setItem.call(this, key, value)
    })
    fireEvent.change(budget(), { target: { value: '5000' } })
    expect(screen.queryByText(fx.notSaved)).toBeNull()
  })

  test('renomear remove os espaços nas pontas', async () => {
    render(<App />)
    await openMenu(fx.firstName)
    await userEvent.setup().click(menu().getByRole('button', { name: fx.rename }))
    await userEvent.setup().keyboard('  Natal  {Enter}')
    expect(menuButton('Natal')).toBeInTheDocument()
  })
})

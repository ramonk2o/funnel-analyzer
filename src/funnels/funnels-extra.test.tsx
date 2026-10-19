import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { initialForm, updateStage, type FunnelForm } from '../funnel/form'
import { texts } from '../texts'
import { formShape } from '../test/formShape'
import { funnelFromFile, funnelToFile } from './file'
import { loadLibrary, saveLibrary } from './storage'

// Extra tests written by the independent tester for "Lista de funis, modelos e arquivo".

const fx = texts.funnels
const t = texts.panel

const menuButton = (name: string) => screen.getByRole('button', { name: fx.menuButton(name) })
const menu = () => within(screen.getByRole('dialog', { name: fx.menuLabel }))
const queryMenu = () => screen.queryByRole('dialog', { name: fx.menuLabel })
const listedNames = () =>
  menu()
    .getAllByRole('button')
    .filter((b) => b.closest('ul'))
    .map((b) => b.textContent)
const budget = () => screen.getByLabelText(t.budget)
const panel = () => within(screen.getByRole('complementary', { name: t.label }))

function stage(n: number) {
  const group = panel().getByRole('group', { name: t.stageGroup(n) })
  const toggle = group.querySelector<HTMLElement>('[aria-expanded="false"]')
  if (toggle) fireEvent.click(toggle)
  return within(group)
}

async function openMenu(name: string) {
  await userEvent.setup().click(menuButton(name))
}

async function action(activeName: string, label: string) {
  await openMenu(activeName)
  await userEvent.setup().click(menu().getByRole('button', { name: label }))
}

async function newFromTemplate(activeName: string, template: string) {
  await action(activeName, fx.newFunnel)
  await userEvent.setup().click(menu().getByRole('button', { name: template }))
}

function reload(view: { unmount: () => void }) {
  view.unmount()
  return render(<App />)
}

test('extra: a primeira visita já grava "Meu funil" no navegador, sem nenhuma edição', () => {
  render(<App />)
  const saved = loadLibrary(localStorage)!
  expect(saved.funnels.map((f) => f.name)).toEqual([fx.firstName])
})

test('extra: recarregar depois de renomear mantém o novo nome', async () => {
  const view = render(<App />)
  await action(fx.firstName, fx.rename)
  await userEvent.setup().keyboard('Natal{Enter}')
  reload(view)
  expect(menuButton('Natal')).toBeInTheDocument()
})

test('extra: recarregar depois de apagar não traz o funil de volta, e abre o primeiro', async () => {
  const user = userEvent.setup()
  let view = render(<App />)
  await newFromTemplate(fx.firstName, fx.templates.b2b)
  await action(fx.templates.b2b, fx.remove)
  await user.click(menu().getByRole('button', { name: fx.yes }))
  view = reload(view)
  expect(menuButton(fx.firstName)).toBeInTheDocument()
  await openMenu(fx.firstName)
  expect(listedNames()).toEqual([fx.firstName])
})

test('extra: recarregar depois de trocar de funil pela lista abre o escolhido', async () => {
  const user = userEvent.setup()
  const view = render(<App />)
  await newFromTemplate(fx.firstName, fx.templates.b2b)
  await openMenu(fx.templates.b2b)
  await user.click(menu().getByRole('button', { name: fx.firstName }))
  reload(view)
  expect(menuButton(fx.firstName)).toBeInTheDocument()
  expect(budget()).toHaveValue('2000')
})

test('extra: se o último ativo não existe mais, abre o primeiro da lista', () => {
  const lib = {
    activeId: 'sumiu',
    funnels: [
      { id: 'a', name: 'Primeiro', form: initialForm() },
      { id: 'b', name: 'Segundo', form: initialForm() },
    ],
  }
  saveLibrary(lib, localStorage)
  render(<App />)
  expect(menuButton('Primeiro')).toBeInTheDocument()
})

test('extra: duplicar fica no fim da lista e marcado como ativo', async () => {
  render(<App />)
  await newFromTemplate(fx.firstName, fx.templates.b2b)
  await openMenu(fx.templates.b2b)
  await userEvent.setup().click(menu().getByRole('button', { name: fx.firstName }))
  await action(fx.firstName, fx.duplicate)
  await openMenu(`${fx.firstName} (cópia)`)
  expect(listedNames()).toEqual([fx.firstName, fx.templates.b2b, `${fx.firstName} (cópia)`])
  const current = menu()
    .getAllByRole('button')
    .find((b) => b.getAttribute('aria-current') === 'true')
  expect(current).toHaveTextContent(`${fx.firstName} (cópia)`)
})

test('extra: duplicar duas vezes dá "(cópia)" e "(cópia 2)"', async () => {
  const user = userEvent.setup()
  render(<App />)
  await action(fx.firstName, fx.duplicate)
  await openMenu(`${fx.firstName} (cópia)`)
  await user.click(menu().getByRole('button', { name: fx.firstName }))
  await action(fx.firstName, fx.duplicate)
  expect(menuButton(`${fx.firstName} (cópia 2)`)).toBeInTheDocument()
})

test('extra: renomear uma etapa da cópia não muda a etapa do original', async () => {
  const user = userEvent.setup()
  render(<App />)
  await action(fx.firstName, fx.duplicate)
  const name = stage(2).getByLabelText(t.name)
  await user.clear(name)
  await user.type(name, 'Visitas')
  await openMenu(`${fx.firstName} (cópia)`)
  await user.click(menu().getByRole('button', { name: fx.firstName }))
  expect(stage(2).getByLabelText(t.name)).toHaveValue('Cliques')
})

test('extra: dois funis em branco seguidos: "Funil 1" e "Funil 2"', async () => {
  render(<App />)
  await newFromTemplate(fx.firstName, fx.templates.blank)
  await newFromTemplate('Funil 1', fx.templates.blank)
  expect(menuButton('Funil 2')).toBeInTheDocument()
})

test('extra: Esc fecha o menu', async () => {
  const user = userEvent.setup()
  render(<App />)
  await openMenu(fx.firstName)
  expect(queryMenu()).not.toBeNull()
  await user.keyboard('{Escape}')
  expect(queryMenu()).toBeNull()
})

test('extra: um funil salvo no modo meta com campo inválido abre no modo meta, marcado e com o aviso', () => {
  let form: FunnelForm = { ...initialForm(), mode: 'goal' }
  form = { ...form, goalTarget: form.stages[3].id, goal: '45' }
  form = updateStage(form, form.stages[1].id, { conversion: 'abc' })
  saveLibrary({ activeId: 'x', funnels: [{ id: 'x', name: 'Meta', form }] }, localStorage)
  render(<App />)
  expect(panel().getByRole('radio', { name: texts.mode.goal })).toBeChecked()
  expect(screen.getByText(texts.funnel.fixFields)).toBeInTheDocument()
  expect(stage(2).getByLabelText(t.conversion)).toHaveAttribute('aria-invalid', 'true')
})

test('extra: exportar leva o texto inválido como foi digitado, e importar o traz de volta', () => {
  const form = updateStage({ ...initialForm(), budget: 'abc' }, initialForm().stages[1].id, { conversion: '' })
  const file = JSON.parse(funnelToFile({ name: 'X', form }))
  expect(file.funnel.budget).toBe('abc')
  const back = funnelFromFile(JSON.stringify(file))!
  expect(formShape(back.form)).toEqual(formShape(form))
})

test('extra: importar um arquivo válido com campo inválido cria o funil e mostra o aviso de correção', async () => {
  const user = userEvent.setup()
  render(<App />)
  const file = new File([funnelToFile({ name: 'Natal', form: { ...initialForm(), budget: 'abc' } })], 'natal.json', {
    type: 'application/json',
  })
  await user.upload(screen.getByLabelText(fx.importFile), file)
  expect(await screen.findByRole('button', { name: fx.menuButton('Natal') })).toBeInTheDocument()
  expect(budget()).toHaveValue('abc')
  expect(screen.getByText(texts.funnel.fixFields)).toBeInTheDocument()
})

test('extra: importar o mesmo nome duas vezes dá "(2)" e "(3)"', async () => {
  const user = userEvent.setup()
  render(<App />)
  const text = funnelToFile({ name: fx.firstName, form: initialForm() })
  await user.upload(screen.getByLabelText(fx.importFile), new File([text], 'a.json'))
  await screen.findByRole('button', { name: fx.menuButton(`${fx.firstName} (2)`) })
  await user.upload(screen.getByLabelText(fx.importFile), new File([text], 'a.json'))
  await screen.findByRole('button', { name: fx.menuButton(`${fx.firstName} (3)`) })
  await openMenu(`${fx.firstName} (3)`)
  expect(listedNames()).toEqual([fx.firstName, `${fx.firstName} (2)`, `${fx.firstName} (3)`])
})

test('extra: importar arquivo de versão mais nova mostra o erro e não cria funil', async () => {
  const user = userEvent.setup()
  render(<App />)
  const data = JSON.parse(funnelToFile({ name: 'Natal', form: initialForm() }))
  await user.upload(screen.getByLabelText(fx.importFile), new File([JSON.stringify({ ...data, version: 99 })], 'n.json'))
  expect(await screen.findByText(fx.invalidFile)).toBeInTheDocument()
  await openMenu(fx.firstName)
  expect(listedNames()).toEqual([fx.firstName])
})

test('extra: os modelos abrem no modo orçamento mesmo vindo de um funil no modo meta', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(panel().getByText(texts.mode.goal))
  await newFromTemplate(fx.firstName, fx.templates.paidTraffic)
  expect(panel().getByRole('radio', { name: texts.mode.budget })).toBeChecked()
  expect(budget()).toHaveValue('3000')
})

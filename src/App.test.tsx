import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { texts } from './texts'
import { THEME_STORAGE_KEY } from './theme/theme'

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

afterEach(() => {
  vi.restoreAllMocks()
})

const s = texts.settings
const settings = () => within(screen.getByRole('dialog', { name: s.title }))
const themeOption = (name: string) =>
  within(settings().getByRole('group', { name: s.theme })).getByRole('radio', { name })

async function openSettings() {
  await userEvent.setup().click(screen.getByRole('button', { name: s.open }))
}
async function chooseTheme(name: string) {
  await openSettings()
  await userEvent.setup().click(themeOption(name))
}

test('mostra o nome do produto e as áreas do painel e do funil', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 1, name: texts.appName })).toBeInTheDocument()
  expect(screen.getByRole('complementary', { name: texts.panel.label })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: texts.funnel.label })).toBeInTheDocument()
})

test('na primeira visita, abre no tema escuro', async () => {
  render(<App />)
  expect(document.documentElement.dataset.theme).toBe('dark')
  await openSettings()
  expect(themeOption(s.dark)).toBeChecked()
  expect(themeOption(s.light)).not.toBeChecked()
})

test('o tema, nas configurações, alterna entre escuro e claro na hora e salva a escolha', async () => {
  render(<App />)

  await chooseTheme(s.light)
  expect(document.documentElement.dataset.theme).toBe('light')
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')

  await userEvent.setup().click(themeOption(s.dark))
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
})

test('abre no tema salvo', async () => {
  localStorage.setItem(THEME_STORAGE_KEY, 'light')
  render(<App />)
  expect(document.documentElement.dataset.theme).toBe('light')
  await openSettings()
  expect(themeOption(s.light)).toBeChecked()
})

test('um valor salvo inválido é ignorado e abre no escuro', () => {
  localStorage.setItem(THEME_STORAGE_KEY, '{quebrado')
  render(<App />)
  expect(document.documentElement.dataset.theme).toBe('dark')
})

test('sem armazenamento, abre no escuro e a troca de tema continua funcionando', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  render(<App />)
  expect(document.documentElement.dataset.theme).toBe('dark')

  await chooseTheme(s.light)
  expect(document.documentElement.dataset.theme).toBe('light')
})

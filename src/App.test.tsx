import { render, screen } from '@testing-library/react'
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

test('mostra o nome do produto e as áreas do painel e do funil', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 1, name: texts.appName })).toBeInTheDocument()
  expect(screen.getByRole('complementary', { name: texts.panel.label })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: texts.funnel.label })).toBeInTheDocument()
})

test('na primeira visita, abre no tema escuro', () => {
  render(<App />)
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(screen.getByRole('button', { name: texts.theme.switchToLight })).toBeInTheDocument()
})

test('o botão de tema alterna entre escuro e claro e salva a escolha', async () => {
  const user = userEvent.setup()
  render(<App />)

  await user.click(screen.getByRole('button', { name: texts.theme.switchToLight }))
  expect(document.documentElement.dataset.theme).toBe('light')
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')

  await user.click(screen.getByRole('button', { name: texts.theme.switchToDark }))
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
})

test('abre no tema salvo', () => {
  localStorage.setItem(THEME_STORAGE_KEY, 'light')
  render(<App />)
  expect(document.documentElement.dataset.theme).toBe('light')
  expect(screen.getByRole('button', { name: texts.theme.switchToDark })).toBeInTheDocument()
})

test('um valor salvo inválido é ignorado e abre no escuro', () => {
  localStorage.setItem(THEME_STORAGE_KEY, '{quebrado')
  render(<App />)
  expect(document.documentElement.dataset.theme).toBe('dark')
})

test('sem armazenamento, abre no escuro e o botão continua funcionando', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  const user = userEvent.setup()
  render(<App />)
  expect(document.documentElement.dataset.theme).toBe('dark')

  await user.click(screen.getByRole('button', { name: texts.theme.switchToLight }))
  expect(document.documentElement.dataset.theme).toBe('light')
})

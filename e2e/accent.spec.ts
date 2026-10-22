import { expect, test, type Page } from '@playwright/test'

const dialog = (page: Page) => page.getByRole('dialog', { name: 'Configurações' })
const accent = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim())

async function openSettings(page: Page) {
  await page.getByRole('button', { name: 'Configurações' }).click()
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 })
})

test('uma cor pronta continua depois de recarregar', async ({ page }) => {
  await page.goto('/')
  await openSettings(page)
  // The radio itself is hidden behind its swatch.
  await dialog(page).getByTitle('Verde').click()
  const chosen = await accent(page)
  expect(chosen).not.toBe('#a78bfa')

  await page.reload()
  expect(await accent(page)).toBe(chosen)
  await openSettings(page)
  await expect(dialog(page).getByRole('radio', { name: 'Verde' })).toBeChecked()
})

test('uma cor personalizada continua depois de recarregar, com o campo preenchido', async ({ page }) => {
  await page.goto('/')
  await openSettings(page)
  await dialog(page).getByText('Personalizada').click()
  await dialog(page).getByRole('textbox', { name: 'Hexadecimal' }).fill('#22c55e')
  const chosen = await accent(page)

  await page.reload()
  expect(await accent(page)).toBe(chosen)
  await openSettings(page)
  await expect(dialog(page).getByRole('radio', { name: 'Personalizada' })).toBeChecked()
  await expect(dialog(page).getByRole('textbox', { name: 'Hexadecimal' })).toHaveValue('#22c55e')
})

test('a cor escolhida já está aplicada antes do React carregar (sem piscar o violeta)', async ({ page }) => {
  await page.goto('/')
  await openSettings(page)
  await dialog(page).getByText('Claro').click()
  await dialog(page).getByText('Personalizada').click()
  await dialog(page).getByRole('textbox', { name: 'Hexadecimal' }).fill('#ffff00')
  const chosen = await accent(page)
  expect(chosen).not.toBe('#ffff00')

  await page.route('**/src/main.tsx*', (route) => route.abort())
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  expect(await accent(page)).toBe(chosen)
})

test('um valor salvo inválido não pinta nada antes do React carregar: fica o violeta', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'analisador-de-funil:destaque',
      JSON.stringify({ cor: 'roxo', personalizada: null, vars: { dark: { '--accent': '#ff0000', '--text': '#ff0000' } } }),
    ),
  )
  await page.route('**/src/main.tsx*', (route) => route.abort())
  await page.goto('/')
  // Nothing painted over the page's own colors (with the app blocked, its CSS doesn't load either).
  expect(await page.evaluate(() => document.documentElement.getAttribute('style'))).toBeNull()
})

test('uma cor salva válida só pinta as variáveis de destaque antes do React carregar', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'analisador-de-funil:destaque',
      JSON.stringify({ cor: 'azul', personalizada: null, vars: { dark: { '--accent': '#60a5fa', '--text': '#ff0000' } } }),
    ),
  )
  await page.route('**/src/main.tsx*', (route) => route.abort())
  await page.goto('/')
  expect(await accent(page)).toBe('#60a5fa')
  expect(await page.evaluate(() => document.documentElement.style.getPropertyValue('--text'))).toBe('')
})

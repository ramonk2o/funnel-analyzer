import { expect, test } from '@playwright/test'

test('valor salvo inválido: abre no escuro, sem erro', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.addInitScript(() => localStorage.setItem('analisador-de-funil:tema', '{quebrado'))
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Configurações' }).click()
  await expect(page.getByRole('radio', { name: 'Escuro' })).toBeChecked()
  expect(errors).toEqual([])
})

test('sem armazenamento: abre no escuro, sem erro, e a troca de tema funciona', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('blocked', 'SecurityError')
      },
    })
  })
  await page.goto('/')
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Configurações' }).click()
  await page.getByRole('dialog', { name: 'Configurações' }).getByText('Claro').click()
  await expect(html).toHaveAttribute('data-theme', 'light')
  expect(errors).toEqual([])
})

test('tema claro salvo já está aplicado antes do React carregar (sem piscar)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('analisador-de-funil:tema', 'light'))
  await page.route('**/src/main.tsx*', (route) => route.abort())
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('sem internet para as fontes: a página carrega e usa fonte de reserva', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort())
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Analisador de Funil' })).toBeVisible()
  const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
  expect(family).toMatch(/Space Grotesk.*sans-serif/)
  expect(errors).toEqual([])
})

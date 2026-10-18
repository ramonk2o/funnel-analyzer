import { expect, test } from '@playwright/test'

test('valor salvo inválido: abre no escuro, sem erro', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.addInitScript(() => localStorage.setItem('simulador-de-funil:tema', '{quebrado'))
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('button', { name: 'Mudar para tema claro' })).toBeVisible()
  expect(errors).toEqual([])
})

test('sem armazenamento: abre no escuro, sem erro, e o botão funciona', async ({ page }) => {
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
  await page.getByRole('button', { name: 'Mudar para tema claro' }).click()
  await expect(html).toHaveAttribute('data-theme', 'light')
  expect(errors).toEqual([])
})

test('tema claro salvo já está aplicado antes do React carregar (sem piscar)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('simulador-de-funil:tema', 'light'))
  await page.route('**/src/main.tsx*', (route) => route.abort())
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('sem internet para as fontes: a página carrega e usa fonte de reserva', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort())
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Simulador de Funil' })).toBeVisible()
  const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
  expect(family).toMatch(/Space Grotesk.*sans-serif/)
  expect(errors).toEqual([])
})

test('no celular, o painel fica embaixo do funil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const funnel = await page.getByRole('region', { name: 'Funil' }).boundingBox()
  const panel = await page.getByRole('complementary', { name: 'Painel do funil' }).boundingBox()
  expect(panel!.y).toBeGreaterThan(funnel!.y + funnel!.height - 1)
})

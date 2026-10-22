import { expect, test, type Page } from '@playwright/test'

const dialog = (page: Page) => page.getByRole('dialog', { name: 'Configurações' })
const accent = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim())

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 })
})

test('trocar o tema depois de escolher a cor: antes do React carregar, já vale a versão do novo tema', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Configurações' }).click()
  await dialog(page).getByText('Personalizada').click()
  await dialog(page).getByRole('textbox', { name: 'Hexadecimal' }).fill('#ffff00')
  const dark = await accent(page)
  await dialog(page).getByText('Claro').click()
  const light = await accent(page)
  expect(light).not.toBe(dark)

  await page.route('**/src/main.tsx*', (route) => route.abort())
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  expect(await accent(page)).toBe(light)
})

test('um valor salvo inválido termina no Violeta depois de carregar', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() =>
    localStorage.setItem('analisador-de-funil:destaque', JSON.stringify({ cor: 'xyz', vars: { dark: { '--accent': '#ff0000' } } })),
  )
  await page.reload()
  await expect(page.getByRole('button', { name: 'Configurações' })).toBeVisible()
  expect(await accent(page)).toBe('#a78bfa')
})

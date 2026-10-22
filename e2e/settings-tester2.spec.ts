import { expect, test, type Page } from '@playwright/test'

const gear = (page: Page) => page.getByRole('button', { name: 'Configurações' })
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Configurações' })
const sidebarButton = (page: Page) => page.getByRole('banner').getByRole('button', { name: /edição/ })
const inDialog = (page: Page) => dialog(page).evaluate((d) => d.contains(document.activeElement))

test('tela estreita com a barra aberta: o Tab não sai do modal', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 800 })
  await page.goto('/')
  await sidebarButton(page).click()
  await expect(page.getByRole('complementary', { name: 'Painel do funil' })).toBeVisible()
  await gear(page).click()
  await expect(dialog(page)).toBeVisible()
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Tab')
    expect(await inDialog(page)).toBe(true)
  }
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Shift+Tab')
    expect(await inDialog(page)).toBe(true)
  }
})

test('tela estreita com a barra aberta: Esc fecha só o modal, com o foco na engrenagem', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 800 })
  await page.goto('/')
  await sidebarButton(page).click()
  await gear(page).click()
  await page.keyboard.press('Escape')
  await expect(dialog(page)).toBeHidden()
  await expect(gear(page)).toBeFocused()
  await expect(page.getByRole('complementary', { name: 'Painel do funil' })).toBeVisible()
})

test('o tema claro escolhido no modal é aplicado antes de a página aparecer', async ({ page }) => {
  await page.goto('/')
  await gear(page).click()
  await dialog(page).getByText('Claro').click()
  // Without the app's script, only the early script in the page can set the theme.
  await page.route('**/src/main.tsx', (route) => route.abort())
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('com o ponto salvo, a página abre com ponto e o modal abre com o foco no tema', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 })
  await page.addInitScript(() => localStorage.setItem('analisador-de-funil:separador', 'ponto'))
  await page.goto('/')
  await expect(page.getByLabel('Resultados')).toContainText('R$ 2,000.00')
  await gear(page).click()
  await expect(page.getByRole('radio', { name: 'Ponto (1.50)' })).toBeChecked()
  await expect(page.getByRole('radio', { name: 'Escuro' })).toBeFocused()
})

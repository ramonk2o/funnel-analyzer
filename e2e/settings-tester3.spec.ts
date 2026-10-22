import { expect, test, type Page } from '@playwright/test'

const gear = (page: Page) => page.getByRole('button', { name: 'Configurações' })
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Configurações' })

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 })
})

test('pressionar no fundo e soltar dentro do modal não fecha', async ({ page }) => {
  await page.goto('/')
  await gear(page).click()
  const box = (await dialog(page).getByRole('heading').boundingBox())!
  await page.mouse.move(5, 5)
  await page.mouse.down()
  await page.mouse.move(box.x + 5, box.y + 5)
  await page.mouse.up()
  await expect(dialog(page)).toBeVisible()
})

test('clicar no fundo (começa e termina nele) fecha, com o foco na engrenagem', async ({ page }) => {
  await page.goto('/')
  await gear(page).click()
  await page.mouse.click(5, 5)
  await expect(dialog(page)).toBeHidden()
  await expect(gear(page)).toBeFocused()
})

test('com o tema claro salvo, abrir o modal põe o foco em "Claro"', async ({ page }) => {
  await page.goto('/')
  await gear(page).click()
  await dialog(page).getByText('Claro').click()
  await page.keyboard.press('Escape')
  await page.reload()
  await gear(page).click()
  await expect(page.getByRole('radio', { name: 'Claro' })).toBeFocused()
})

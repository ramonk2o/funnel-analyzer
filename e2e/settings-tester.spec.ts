import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 })
})

test('clicar no título do modal e apertar Esc ainda fecha, com o foco na engrenagem', async ({ page }) => {
  await page.goto('/')
  const gear = page.getByRole('button', { name: 'Configurações' })
  await gear.click()
  const dialog = page.getByRole('dialog', { name: 'Configurações' })
  await dialog.getByRole('heading', { name: 'Configurações' }).click()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(gear).toBeFocused()
})

test('clicar no título do modal e apertar Tab mantém o foco no modal', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Configurações' }).click()
  const dialog = page.getByRole('dialog', { name: 'Configurações' })
  await dialog.getByRole('heading', { name: 'Configurações' }).click()
  await page.keyboard.press('Tab')
  expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true)
})

for (const width of [320, 360, 390]) {
  test(`tela estreita (${width}px): a engrenagem pode ser clicada e a página não rola para os lados`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Configurações' }).click({ timeout: 3000 })
    await expect(page.getByRole('dialog', { name: 'Configurações' })).toBeVisible()
    await page.keyboard.press('Escape')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  })
}

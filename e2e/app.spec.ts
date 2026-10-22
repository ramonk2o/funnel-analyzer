import { expect, test } from '@playwright/test'

test('abre o app', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Analisador de Funil')
  await expect(page.getByRole('heading', { name: 'Analisador de Funil' })).toBeVisible()
})

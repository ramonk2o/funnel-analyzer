import { expect, test } from '@playwright/test'

test('a escolha do tema continua depois de recarregar', async ({ page }) => {
  await page.goto('/')
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-theme', 'dark')

  await page.getByRole('button', { name: 'Configurações' }).click()
  await page.getByRole('dialog', { name: 'Configurações' }).getByText('Claro').click()
  await expect(html).toHaveAttribute('data-theme', 'light')

  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: 'Configurações' }).click()
  await expect(page.getByRole('radio', { name: 'Claro' })).toBeChecked()
})

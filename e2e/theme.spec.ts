import { expect, test } from '@playwright/test'

test('a escolha do tema continua depois de recarregar', async ({ page }) => {
  await page.goto('/')
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-theme', 'dark')

  await page.getByRole('button', { name: 'Mudar para tema claro' }).click()
  await expect(html).toHaveAttribute('data-theme', 'light')

  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'light')
  await expect(page.getByRole('button', { name: 'Mudar para tema escuro' })).toBeVisible()
})

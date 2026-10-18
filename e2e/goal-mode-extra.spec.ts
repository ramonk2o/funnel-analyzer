import { expect, test } from '@playwright/test'

// Extra tests written by the tester for "Modo meta".

test('extra: recarregar a página volta ao modo orçamento, com a verba de exemplo', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 })
  await page.goto('/')
  const panel = page.getByRole('complementary', { name: 'Painel do funil' })
  await panel.getByText('Tenho uma meta').click()
  await expect(page.getByRole('region', { name: 'Investimento necessário' })).toBeVisible()
  await page.reload()
  await expect(panel.getByRole('radio', { name: 'Tenho um orçamento' })).toBeChecked()
  await expect(page.getByRole('region', { name: 'Investimento necessário' })).toHaveCount(0)
  await expect(panel.getByLabel('Verba de mídia (R$)')).toHaveValue('2000')
})

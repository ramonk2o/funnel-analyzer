// Extra tests written by the independent tester.
import { expect, test } from '@playwright/test'

test('recarregar a página volta ao funil de exemplo', async ({ page }) => {
  await page.goto('/')
  const budget = page.getByLabel('Verba de mídia (R$)')
  await budget.fill('5000')
  const stage2 = page.getByRole('group', { name: 'Etapa 2' })
  await stage2.locator('[aria-expanded]').click()
  await stage2.getByLabel('Nome').fill('Visitas')
  await page.getByRole('button', { name: 'Adicionar etapa' }).click()
  const funnel = page.getByRole('list', { name: 'Etapas do funil' })
  await expect(funnel.locator('.funnel-band-volume').first()).toHaveText('250.000')

  await page.reload()
  await expect(page.getByLabel('Verba de mídia (R$)')).toHaveValue('2000')
  await expect(funnel.locator('.funnel-band-name')).toHaveText(['Impressões', 'Cliques', 'Leads', 'Vendas'])
  await expect(funnel.locator('.funnel-band-volume')).toHaveText(['100.000', '2.500', '300', '45'])
  // Só a 1ª etapa volta aberta.
  await expect(page.getByRole('group', { name: 'Etapa 1' }).locator('[aria-expanded]')).toHaveAttribute('aria-expanded', 'true')
  await expect(stage2.locator('[aria-expanded]')).toHaveAttribute('aria-expanded', 'false')
})

test('no navegador, digitar na verba recalcula a cada tecla', async ({ page }) => {
  await page.goto('/')
  const budget = page.getByLabel('Verba de mídia (R$)')
  await budget.fill('')
  await budget.pressSequentially('1')
  const first = page.getByRole('list', { name: 'Etapas do funil' }).locator('.funnel-band-volume').first()
  await expect(first).toHaveText('50')
  await budget.pressSequentially('0')
  await expect(first).toHaveText('500')
})

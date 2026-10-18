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

test('etapa recolhida mostra nome e resumo inteiros, sem invadir os botões', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 })
  await page.goto('/')
  const stage1 = page.getByRole('group', { name: 'Etapa 1' })
  await stage1.locator('[aria-expanded]').click() // recolhe a 1ª
  for (const n of [1, 2, 3, 4]) {
    const stage = page.getByRole('group', { name: `Etapa ${n}` })
    const name = (await stage.locator('.stage-name').boundingBox())!
    const value = (await stage.locator('.stage-value').boundingBox())!
    const actions = (await stage.locator('.stage-actions').boundingBox())!
    // O nome aparece, com espaço para pelo menos algumas letras.
    expect(name.width).toBeGreaterThan(40)
    // O resumo cabe inteiro (sem reticências) e não se sobrepõe aos botões.
    expect(await stage.locator('.stage-value').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
    const overlaps =
      value.x < actions.x + actions.width &&
      value.x + value.width > actions.x &&
      value.y < actions.y + actions.height &&
      value.y + value.height > actions.y
    expect(overlaps).toBe(false)
  }
})

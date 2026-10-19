import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'

const panel = (page: Page) => page.getByRole('complementary', { name: 'Painel do funil' })
const menuButton = (page: Page, name: string) => page.getByRole('button', { name: `Funis salvos: ${name}` })
const menu = (page: Page) => page.getByRole('dialog', { name: 'Funis salvos' })
const bandNames = (page: Page) => page.getByRole('list', { name: 'Etapas do funil' }).locator('.funnel-band-name')

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 })
})

test('primeira visita: "Meu funil", com o funil de exemplo', async ({ page }) => {
  await page.goto('/')
  await expect(menuButton(page, 'Meu funil')).toBeVisible()
  await expect(bandNames(page)).toHaveText(['Impressões', 'Cliques', 'Leads', 'Vendas'])
  await expect(panel(page).getByLabel('Verba de mídia (R$)')).toHaveValue('2000')
})

test('editar, trocar o modo e recarregar mantém tudo, no modo em que estava', async ({ page }) => {
  await page.goto('/')
  await panel(page).getByLabel('Verba de mídia (R$)').fill('5000')
  const stage2 = panel(page).getByRole('group', { name: 'Etapa 2' })
  await stage2.locator('[aria-expanded]').click()
  await stage2.getByLabel('Nome').fill('Visitas')
  await panel(page).getByText('Tenho uma meta').click()
  await panel(page).getByLabel('Meta (quantidade)').fill('200')
  await expect(page.getByRole('region', { name: 'Investimento necessário' })).toBeVisible()

  await page.reload()
  await expect(panel(page).getByRole('radio', { name: 'Tenho uma meta' })).toBeChecked()
  await expect(panel(page).getByLabel('Meta (quantidade)')).toHaveValue('200')
  await expect(bandNames(page)).toHaveText(['Impressões', 'Visitas', 'Leads', 'Vendas'])
  await panel(page).getByText('Tenho um orçamento').click()
  await expect(panel(page).getByLabel('Verba de mídia (R$)')).toHaveValue('5000')
})

test('com dois funis, recarregar abre o último ativo', async ({ page }) => {
  await page.goto('/')
  await menuButton(page, 'Meu funil').click()
  await menu(page).getByRole('button', { name: 'Novo funil' }).click()
  await menu(page).getByRole('button', { name: 'B2B' }).click()
  await expect(bandNames(page)).toHaveText(['Leads', 'MQL', 'SQL', 'Venda'])

  await page.reload()
  await expect(menuButton(page, 'B2B')).toBeVisible()
  await expect(bandNames(page)).toHaveText(['Leads', 'MQL', 'SQL', 'Venda'])
})

test('exportar baixa "<nome>.json"; importar cria "<nome> (2)" sem sobrescrever', async ({ page }) => {
  await page.goto('/')
  await panel(page).getByLabel('Verba de mídia (R$)').fill('7000')
  await menuButton(page, 'Meu funil').click()
  const downloading = page.waitForEvent('download')
  await menu(page).getByRole('button', { name: 'Exportar' }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('Meu funil.json')
  const content = await readFile(await download.path())

  await panel(page).getByLabel('Verba de mídia (R$)').fill('1000')
  await page.getByLabel('Arquivo para importar').setInputFiles({
    name: 'Meu funil.json',
    mimeType: 'application/json',
    buffer: content,
  })
  await expect(menuButton(page, 'Meu funil (2)')).toBeVisible()
  await expect(panel(page).getByLabel('Verba de mídia (R$)')).toHaveValue('7000')

  await menuButton(page, 'Meu funil (2)').click()
  await expect(menu(page).getByRole('listitem')).toHaveText(['Meu funil', 'Meu funil (2)'])
  await menu(page).getByRole('button', { name: 'Meu funil', exact: true }).click()
  await expect(panel(page).getByLabel('Verba de mídia (R$)')).toHaveValue('1000')
})

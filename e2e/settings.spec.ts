import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'

const panel = (page: Page) => page.getByRole('complementary', { name: 'Painel do funil' })
const unitCost = (page: Page) => panel(page).getByLabel('Custo de mídia (R$)')
const menuButton = (page: Page, name: string) => page.getByRole('button', { name: `Funis salvos: ${name}` })
const menu = (page: Page) => page.getByRole('dialog', { name: 'Funis salvos' })

async function choose(page: Page, option: string) {
  await page.getByRole('button', { name: 'Configurações' }).click()
  // The radio itself is hidden behind its label, like the mode selector.
  await page.getByRole('dialog', { name: 'Configurações' }).getByText(option).click()
  await page.getByRole('dialog', { name: 'Configurações' }).getByRole('button', { name: 'Fechar' }).click()
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 })
})

test('o ponto continua escolhido depois de recarregar, com os funis convertidos', async ({ page }) => {
  await page.goto('/')
  await unitCost(page).fill('20,5')
  await choose(page, 'Ponto (1.50)')
  await expect(unitCost(page)).toHaveValue('20.5')

  await page.reload()
  await expect(unitCost(page)).toHaveValue('20.5')
  await expect(page.getByLabel('Resultados')).toContainText('R$ 2,000.00')
  await page.getByRole('button', { name: 'Configurações' }).click()
  await expect(page.getByRole('radio', { name: 'Ponto (1.50)' })).toBeChecked()
})

test('exportar com ponto baixa o arquivo com vírgula; importar com ponto mostra ponto', async ({ page }) => {
  await page.goto('/')
  await choose(page, 'Ponto (1.50)')
  await unitCost(page).fill('1.75')

  await menuButton(page, 'Meu funil').click()
  const downloading = page.waitForEvent('download')
  await menu(page).getByRole('button', { name: 'Exportar' }).click()
  const content = await readFile(await (await downloading).path())
  const file = JSON.parse(content.toString())
  expect(file.version).toBe(1)
  expect(file.funnel.unitCost).toBe('1,75')
  expect(file.funnel.stages[1].conversion).toBe('2,5')

  await page.getByLabel('Arquivo para importar').setInputFiles({
    name: 'Meu funil.json',
    mimeType: 'application/json',
    buffer: content,
  })
  await expect(menuButton(page, 'Meu funil (2)')).toBeVisible()
  await expect(unitCost(page)).toHaveValue('1.75')
})

test('arrastar de dentro do modal até o fundo não fecha o modal', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Configurações' }).click()
  const dialog = page.getByRole('dialog', { name: 'Configurações' })
  const box = (await dialog.getByRole('heading').boundingBox())!
  await page.mouse.move(box.x + 5, box.y + 5)
  await page.mouse.down()
  await page.mouse.move(5, 5)
  await page.mouse.up()
  await expect(dialog).toBeVisible()
})

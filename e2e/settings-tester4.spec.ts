import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'

const panel = (page: Page) => page.getByRole('complementary', { name: 'Painel do funil' })
const unitCost = (page: Page) => panel(page).getByLabel('Custo de mídia (R$)')
const menuButton = (page: Page, name: string) => page.getByRole('button', { name: `Funis salvos: ${name}` })
const menu = (page: Page) => page.getByRole('dialog', { name: 'Funis salvos' })

async function choose(page: Page, option: string) {
  await page.getByRole('button', { name: 'Configurações' }).click()
  await page.getByRole('dialog', { name: 'Configurações' }).getByText(option).click()
  await page.getByRole('dialog', { name: 'Configurações' }).getByRole('button', { name: 'Fechar' }).click()
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 })
})

test('exportar com ponto um campo inválido com vírgula ("1,5") grava o texto convertido ("1.5")', async ({ page }) => {
  await page.goto('/')
  await choose(page, 'Ponto (1.50)')
  await unitCost(page).fill('1,5')
  await expect(unitCost(page)).toHaveAttribute('aria-invalid', 'true')
  await menuButton(page, 'Meu funil').click()
  const downloading = page.waitForEvent('download')
  await menu(page).getByRole('button', { name: 'Exportar' }).click()
  const file = JSON.parse((await readFile(await (await downloading).path())).toString())
  expect(file.funnel.unitCost).toBe('1.5')
})

test('separador salvo como ponto e tema claro salvo: os dois valem juntos ao abrir', async ({ page }) => {
  await page.goto('/')
  await choose(page, 'Ponto (1.50)')
  await choose(page, 'Claro')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(page.getByLabel('Resultados')).toContainText('R$ 2,000.00')
  expect(await page.evaluate(() => localStorage.getItem('analisador-de-funil:separador'))).toBe('ponto')
})

test('clicar no fundo fecha também na comparação, com o foco na engrenagem', async ({ page }) => {
  await page.goto('/')
  await menuButton(page, 'Meu funil').click()
  await menu(page).getByRole('button', { name: 'Comparar' }).click()
  await page.getByRole('button', { name: 'Configurações' }).click()
  await expect(page.getByRole('dialog', { name: 'Configurações' })).toBeVisible()
  await page.mouse.click(5, 450)
  await expect(page.getByRole('dialog', { name: 'Configurações' })).toBeHidden()
  await expect(page.getByRole('button', { name: 'Configurações' })).toBeFocused()
})

import { expect, test, type Page } from '@playwright/test'

// Extra checks written by the independent tester.

const panel = (page: Page) => page.getByRole('complementary', { name: 'Painel do funil' })
const funnel = (page: Page) => page.getByRole('region', { name: 'Funil' })
const toggle = (page: Page) => page.getByRole('banner').getByRole('button', { name: /edição/ })
const header = (page: Page) => page.getByRole('banner')

async function makePageTall(page: Page) {
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Adicionar etapa' }).click()
}

test('tela larga: a barra vai do cabeçalho até o fim da janela, colada à esquerda', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 })
  await page.goto('/')
  const side = (await page.locator('.sidebar').boundingBox())!
  const head = (await header(page).boundingBox())!
  expect(side.x).toBe(0)
  expect(Math.abs(side.y - (head.y + head.height))).toBeLessThanOrEqual(1)
  expect(Math.abs(side.y + side.height - 800)).toBeLessThanOrEqual(1)
})

test('o funil continua centralizado com a largura máxima de antes (1280 px)', async ({ page }) => {
  await page.setViewportSize({ width: 1800, height: 800 })
  await page.goto('/')
  const main = (await page.getByRole('main').boundingBox())!
  expect(main.width).toBeLessThanOrEqual(1280)
  const left = main.x
  const right = 1800 - (main.x + main.width)
  expect(Math.abs(left - right)).toBeLessThanOrEqual(1)
})

test('tela larga: barra aberta, o cabeçalho fica fixo no topo ao rolar a página', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 500 })
  await page.goto('/')
  await makePageTall(page)
  await page.mouse.move(1100, 400)
  await page.mouse.wheel(0, 2000)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  const head = (await header(page).boundingBox())!
  expect(head.y).toBe(0)
  await expect(toggle(page)).toBeInViewport()
})

test('tela estreita: barra aberta, o cabeçalho fica fixo no topo com a página rolada', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 })
  await page.goto('/')
  await page.evaluate(() => window.scrollTo(0, 400))
  await toggle(page).click()
  await expect(panel(page)).toBeVisible()
  const head = (await header(page).boundingBox())!
  expect(head.y).toBe(0)
  await toggle(page).click()
  await expect(panel(page)).toBeHidden()
})

test('tela estreita: a barra ocupa ~85% da largura', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 })
  await page.goto('/')
  await toggle(page).click()
  await expect(panel(page)).toBeVisible()
  await page.waitForTimeout(400)
  const side = (await page.locator('.sidebar').boundingBox())!
  expect(side.x).toBe(0)
  expect(Math.abs(side.width - 340)).toBeLessThanOrEqual(2)
})

test('tela larga: sem foco preso, o Tab sai da barra para o funil', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 })
  await page.goto('/')
  await page.getByLabel('Verba de mídia (R$)').focus()
  let left = false
  for (let i = 0; i < 80 && !left; i++) {
    await page.keyboard.press('Tab')
    left = await page.evaluate(() => !!document.activeElement?.closest('main'))
  }
  expect(left).toBe(true)
  await expect(panel(page)).toBeVisible()
})

test('tela larga, barra fechada: clicar na faixa abre a barra e foca o Nome da etapa', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 })
  await page.goto('/')
  await toggle(page).click()
  await expect(panel(page)).toBeHidden()
  await page.getByRole('button', { name: 'Editar etapa Leads' }).click()
  await expect(panel(page)).toBeVisible()
  await expect(page.getByRole('group', { name: 'Etapa 3' }).getByLabel('Nome')).toBeFocused()
})

test('tela estreita, barra fechada: clicar na faixa abre a barra e foca o Nome da etapa', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Editar etapa Leads' }).click()
  await expect(panel(page)).toBeVisible()
  await expect(page.getByRole('group', { name: 'Etapa 3' }).getByLabel('Nome')).toBeFocused()
})

test('tela estreita: fechar pelo fundo com o foco num campo leva o foco ao botão e tira o destaque', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Editar etapa Leads' }).click()
  await expect(page.getByRole('group', { name: 'Etapa 3' }).getByLabel('Nome')).toBeFocused()
  await page.mouse.click(380, 400)
  await expect(panel(page)).toBeHidden()
  await expect(toggle(page)).toBeFocused()
  await expect(page.locator('[aria-current="true"]')).toHaveCount(0)
})

test('o estado fechado continua depois de recarregar (tela larga)', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 })
  await page.goto('/')
  await toggle(page).click()
  await expect(panel(page)).toBeHidden()
  await page.reload()
  await expect(panel(page)).toBeHidden()
  await expect(toggle(page)).toHaveAccessibleName('Abrir edição')
  await toggle(page).click()
  await page.reload()
  await expect(panel(page)).toBeVisible()
})

test('fechada, a barra fica fora da árvore de acessibilidade', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 })
  await page.goto('/')
  await toggle(page).click()
  await expect(page.getByRole('complementary')).toHaveCount(0)
  await expect(page.getByRole('textbox', { name: 'Verba de mídia (R$)' })).toHaveCount(0)
})

test('a barra recebe o painel inteiro: verba, etapas e "Adicionar etapa" dentro dela', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 })
  await page.goto('/')
  const side = page.locator('.sidebar')
  await expect(side.getByLabel('Verba de mídia (R$)')).toBeVisible()
  await expect(side.getByRole('group', { name: 'Etapa 1' })).toBeVisible()
  await expect(side.getByRole('button', { name: 'Adicionar etapa' })).toBeVisible()
  await expect(funnel(page).getByLabel('Verba de mídia (R$)')).toHaveCount(0)
})

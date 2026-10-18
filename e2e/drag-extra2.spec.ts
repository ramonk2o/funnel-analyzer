import { expect, test, type Page } from '@playwright/test'

// Extra tests written by the tester (round 3) for "Arrastar etapas com pré-visualização".

const group = (page: Page, n: number) => page.getByRole('group', { name: `Etapa ${n}`, exact: true })
const handle = (page: Page, n: number) => group(page, n).locator('.stage-handle')
const isOpen = (page: Page, n: number) => group(page, n).locator('[aria-expanded]').getAttribute('aria-expanded')
const panelNames = (page: Page) =>
  page
    .locator('.stages > [data-stage-id]')
    .evaluateAll((els) =>
      els.map((el) => el.querySelector('.stage-name')?.textContent ?? el.querySelector('input')?.value ?? ''),
    )
const bandNames = (page: Page) =>
  page.getByRole('list', { name: 'Etapas do funil' }).locator('.funnel-band-name').allTextContents()
const panel = (page: Page) => page.getByRole('complementary', { name: 'Painel do funil' })
const toggle = (page: Page) => page.getByRole('banner').getByRole('button', { name: /edição/ })
const ORIGINAL = ['Impressões', 'Cliques', 'Leads', 'Vendas']

async function startDrag(page: Page, n: number) {
  const box = (await handle(page, n).boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 8)
}

async function center(page: Page, n: number) {
  const box = (await group(page, n).boundingBox())!
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 })
  await page.goto('/')
})

test('extra2: soltar sobre o cabeçalho cancela e reabre a etapa aberta antes', async ({ page }) => {
  await group(page, 2).locator('[aria-expanded]').click() // abre Cliques
  await page.waitForTimeout(500) // let the open/close animation finish before measuring
  await startDrag(page, 4)
  const target = await center(page, 1)
  await page.mouse.move(target.x, target.y - 10, { steps: 8 })
  await expect.poll(() => panelNames(page)).toEqual(['Vendas', 'Impressões', 'Cliques', 'Leads'])
  const header = (await page.getByRole('banner').boundingBox())!
  await page.mouse.move(header.x + 400, header.y + header.height / 2, { steps: 4 })
  await page.mouse.up()
  await expect.poll(() => panelNames(page)).toEqual(ORIGINAL)
  expect(await bandNames(page)).toEqual(ORIGINAL)
  expect(await isOpen(page, 2)).toBe('true')
  expect(await isOpen(page, 1)).toBe('false')
})

test('extra2: soltar na mesma posição mantém a ordem e abre a etapa arrastada', async ({ page }) => {
  // Impressões (1) está aberta; arrasta Leads (3) e solta no lugar dela.
  await startDrag(page, 3)
  const preview = await panelNames(page)
  const idx = preview.indexOf('Leads')
  // Put the pointer at the placeholder's own center so the order stays the original.
  const ph = (await page.locator('.stage-placeholder').boundingBox())!
  await page.mouse.move(ph.x + ph.width / 2, ph.y + ph.height / 2, { steps: 3 })
  await expect.poll(() => panelNames(page)).toEqual(ORIGINAL)
  await page.mouse.up()
  await expect.poll(() => bandNames(page)).toEqual(ORIGINAL)
  expect(idx).toBeGreaterThanOrEqual(0)
  expect(await isOpen(page, 3)).toBe('true')
  expect(await isOpen(page, 1)).toBe('false')
})

test('extra2: tela estreita, soltar dentro da barra aplica a ordem e a barra continua aberta', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await toggle(page).click()
  await expect(panel(page)).toBeVisible()
  await page.waitForTimeout(500) // let the sidebar's slide-in finish before measuring
  await startDrag(page, 4)
  const target = await center(page, 1)
  await page.mouse.move(target.x, target.y - 10, { steps: 8 })
  await expect.poll(() => panelNames(page)).toEqual(['Vendas', 'Impressões', 'Cliques', 'Leads'])
  await page.mouse.up()
  await expect(panel(page)).toBeVisible()
  await expect.poll(() => panelNames(page)).toEqual(['Vendas', 'Impressões', 'Cliques', 'Leads'])
  expect(await isOpen(page, 1)).toBe('true')
})

test('extra2: um segundo arraste depois de soltar funciona de novo', async ({ page }) => {
  await startDrag(page, 4)
  let target = await center(page, 1)
  await page.mouse.move(target.x, target.y - 10, { steps: 8 })
  await page.mouse.up()
  await expect.poll(() => bandNames(page)).toEqual(['Vendas', 'Impressões', 'Cliques', 'Leads'])
  await startDrag(page, 4) // Leads now
  target = await center(page, 1)
  await page.mouse.move(target.x, target.y - 10, { steps: 8 })
  await page.mouse.up()
  await expect.poll(() => bandNames(page)).toEqual(['Leads', 'Vendas', 'Impressões', 'Cliques'])
})

test('extra2: Esc depois de soltar não desfaz a ordem aplicada', async ({ page }) => {
  await startDrag(page, 4)
  const target = await center(page, 1)
  await page.mouse.move(target.x, target.y - 10, { steps: 8 })
  await page.mouse.up()
  await expect.poll(() => bandNames(page)).toEqual(['Vendas', 'Impressões', 'Cliques', 'Leads'])
  await page.keyboard.press('Escape')
  expect(await bandNames(page)).toEqual(['Vendas', 'Impressões', 'Cliques', 'Leads'])
  expect(await panelNames(page)).toEqual(['Vendas', 'Impressões', 'Cliques', 'Leads'])
})

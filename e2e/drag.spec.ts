import { expect, test, type Page } from '@playwright/test'

// Names in panel order: a collapsed stage shows its name in the header, an open one in the Name field.
const panelNames = (page: Page) =>
  page
    .locator('.stages > [data-stage-id]')
    .evaluateAll((els) =>
      els.map((el) => el.querySelector('.stage-name')?.textContent ?? el.querySelector('input')?.value ?? ''),
    )
const bandNames = (page: Page) =>
  page.getByRole('list', { name: 'Etapas do funil' }).locator('.funnel-band-name').allTextContents()
const handle = (page: Page, n: number) =>
  page.getByRole('group', { name: `Etapa ${n}`, exact: true }).locator('.stage-handle')
const isOpen = (page: Page, n: number) =>
  page
    .getByRole('group', { name: `Etapa ${n}`, exact: true })
    .locator('[aria-expanded]')
    .getAttribute('aria-expanded')

async function center(page: Page, n: number) {
  const box = (await page.getByRole('group', { name: `Etapa ${n}`, exact: true }).boundingBox())!
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

async function startDrag(page: Page, n: number) {
  const box = (await handle(page, n).boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  // The drag only starts once the pointer has moved a few pixels.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 8)
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 })
  await page.goto('/')
})

test('começar a arrastar recolhe todas as etapas e deixa um espaço tracejado', async ({ page }) => {
  await startDrag(page, 3)
  for (const n of [1, 2, 3, 4]) expect(await isOpen(page, n)).toBe('false')
  await expect(page.locator('.stage-placeholder')).toHaveCount(1)
  await expect(page.locator('.stage-placeholder .stage-name')).toHaveText('Leads')
  await expect(page.locator('.stage-ghost')).toBeVisible()
  await page.mouse.up()
})

test('passar sobre outras etapas reorganiza a lista na hora, sem mudar o funil', async ({ page }) => {
  await startDrag(page, 4) // Vendas
  const target = await center(page, 1)
  await page.mouse.move(target.x, target.y - 10, { steps: 8 })
  await expect.poll(() => panelNames(page)).toEqual(['Vendas', 'Impressões', 'Cliques', 'Leads'])
  expect(await bandNames(page)).toEqual(['Impressões', 'Cliques', 'Leads', 'Vendas'])
  await page.keyboard.press('Escape')
})

test('ao soltar, a ordem nova vale no painel e no funil, e a etapa arrastada abre', async ({ page }) => {
  await startDrag(page, 4) // Vendas
  const target = await center(page, 2)
  await page.mouse.move(target.x, target.y - 10, { steps: 8 })
  await page.mouse.up()
  await expect.poll(() => bandNames(page)).toEqual(['Impressões', 'Vendas', 'Cliques', 'Leads'])
  await expect(page.locator('.stage-placeholder')).toHaveCount(0)
  await expect(page.getByRole('group', { name: 'Etapa 2' }).getByLabel('Nome')).toHaveValue('Vendas')
  expect(await isOpen(page, 2)).toBe('true')
})

test('Esc durante o arraste cancela: ordem original e a etapa aberta reabre', async ({ page }) => {
  await page.getByRole('group', { name: 'Etapa 2' }).locator('[aria-expanded]').click() // abre Cliques
  await startDrag(page, 4)
  const target = await center(page, 1)
  await page.mouse.move(target.x, target.y - 10, { steps: 8 })
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await expect.poll(() => panelNames(page)).toEqual(['Impressões', 'Cliques', 'Leads', 'Vendas'])
  expect(await bandNames(page)).toEqual(['Impressões', 'Cliques', 'Leads', 'Vendas'])
  await expect(page.locator('.stage-placeholder')).toHaveCount(0)
  expect(await isOpen(page, 2)).toBe('true')
})

test('soltar fora da lista cancela', async ({ page }) => {
  await startDrag(page, 4)
  const target = await center(page, 1)
  await page.mouse.move(target.x, target.y - 10, { steps: 8 })
  await page.mouse.move(900, 500, { steps: 4 }) // sobre o funil
  await page.mouse.up()
  await expect.poll(() => panelNames(page)).toEqual(['Impressões', 'Cliques', 'Leads', 'Vendas'])
  expect(await bandNames(page)).toEqual(['Impressões', 'Cliques', 'Leads', 'Vendas'])
  expect(await isOpen(page, 1)).toBe('true')
})

test('toque: arrastar pelo ícone também reordena', async ({ page }) => {
  const from = (await handle(page, 4).boundingBox())!
  // Logo abaixo do topo da 1ª etapa: acima do meio dela, aberta ou recolhida.
  const first = (await page.getByRole('group', { name: 'Etapa 1', exact: true }).boundingBox())!
  const to = { y: first.y + 15 }
  await handle(page, 4).evaluate(
    async (el, { from, to }) => {
      const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
      const x = from.x + from.width / 2
      const opts = { bubbles: true, pointerId: 7, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1 }
      el.dispatchEvent(new PointerEvent('pointerdown', { ...opts, clientX: x, clientY: from.y + from.height / 2 }))
      await frame()
      for (let y = from.y; y >= to.y; y -= 20) {
        window.dispatchEvent(new PointerEvent('pointermove', { ...opts, clientX: x, clientY: y }))
        await frame()
      }
      window.dispatchEvent(new PointerEvent('pointermove', { ...opts, clientX: x, clientY: to.y }))
      await frame()
      window.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0, clientX: x, clientY: to.y }))
    },
    { from, to },
  )
  await expect.poll(() => bandNames(page)).toEqual(['Vendas', 'Impressões', 'Cliques', 'Leads'])
})

test('as setas continuam funcionando e o ícone de arrastar não entra no Tab', async ({ page }) => {
  await page.getByRole('group', { name: 'Etapa 2' }).getByRole('button', { name: 'Mover para baixo' }).click()
  await expect.poll(() => bandNames(page)).toEqual(['Impressões', 'Leads', 'Cliques', 'Vendas'])
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => document.activeElement?.classList.contains('stage-handle'))).toBe(false)
  }
})

test('arrastar perto da borda de baixo da barra a rola sozinha', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 500 })
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Adicionar etapa' }).click()
  const sidebar = page.locator('.sidebar')
  await sidebar.evaluate((el) => el.scrollTo(0, 0))
  await startDrag(page, 1)
  const box = (await sidebar.boundingBox())!
  await page.mouse.move(box.x + 100, box.y + box.height - 5, { steps: 5 })
  await expect.poll(() => sidebar.evaluate((el) => el.scrollTop), { timeout: 3000 }).toBeGreaterThan(0)
  await page.keyboard.press('Escape')
  await page.mouse.up()
})

test('clicar no ícone sem mover não faz nada', async ({ page }) => {
  const box = (await handle(page, 3).boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 2, box.y + box.height / 2 + 2) // menos que o limite
  await expect(page.locator('.stage-placeholder')).toHaveCount(0)
  expect(await isOpen(page, 1)).toBe('true')
  await page.mouse.up()
  expect(await isOpen(page, 1)).toBe('true')
  expect(await isOpen(page, 3)).toBe('false')
})

test('soltar em qualquer ponto da barra, fora da lista, aplica a ordem mostrada', async ({ page }) => {
  await startDrag(page, 1) // Impressões
  const sidebar = (await page.locator('.sidebar').boundingBox())!
  const add = (await page.getByRole('button', { name: 'Adicionar etapa' }).boundingBox())!
  await page.mouse.move(sidebar.x + 100, add.y + add.height + 30, { steps: 8 }) // abaixo da lista, ainda na barra
  await expect.poll(() => panelNames(page)).toEqual(['Cliques', 'Leads', 'Vendas', 'Impressões'])
  await page.mouse.up()
  await expect.poll(() => bandNames(page)).toEqual(['Cliques', 'Leads', 'Vendas', 'Impressões'])
})

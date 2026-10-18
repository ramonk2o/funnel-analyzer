import { expect, test, type Page } from '@playwright/test'

// Extra tests written by the tester for "Arrastar etapas com pré-visualização".

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

async function startDrag(page: Page, n: number) {
  const box = (await handle(page, n).boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  // The drag only starts once the pointer has moved a few pixels.
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

test('extra: cancelar com nenhuma etapa aberta antes deixa todas recolhidas', async ({ page }) => {
  await group(page, 1).locator('[aria-expanded]').click() // recolhe Impressões
  for (const n of [1, 2, 3, 4]) expect(await isOpen(page, n)).toBe('false')
  await startDrag(page, 4)
  const target = await center(page, 1)
  await page.mouse.move(target.x, target.y - 10, { steps: 8 })
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await expect.poll(() => panelNames(page)).toEqual(['Impressões', 'Cliques', 'Leads', 'Vendas'])
  for (const n of [1, 2, 3, 4]) expect(await isOpen(page, n)).toBe('false')
})

test('extra: soltar logo depois de começar, abaixo da lista encolhida, aplica a ordem da prévia', async ({ page }) => {
  await startDrag(page, 3) // Leads; a 1ª etapa, aberta, recolhe e a lista encolhe sob o ponteiro
  const preview = await panelNames(page)
  await page.mouse.up()
  await expect.poll(() => bandNames(page)).toEqual(preview)
  expect(await panelNames(page)).toEqual(preview)
  const n = preview.indexOf('Leads') + 1
  expect(await isOpen(page, n)).toBe('true')
})

test('extra: arrastar a primeira para o fim e soltar', async ({ page }) => {
  await startDrag(page, 1)
  const last = (await group(page, 4).boundingBox())!
  await page.mouse.move(last.x + last.width / 2, last.y + last.height - 3, { steps: 10 })
  await expect.poll(() => panelNames(page)).toEqual(['Cliques', 'Leads', 'Vendas', 'Impressões'])
  await page.mouse.up()
  await expect.poll(() => bandNames(page)).toEqual(['Cliques', 'Leads', 'Vendas', 'Impressões'])
  expect(await isOpen(page, 4)).toBe('true')
})

test('extra: os números do funil não mudam durante o arraste', async ({ page }) => {
  const funnel = page.getByRole('region', { name: 'Funil' })
  const before = await funnel.innerText()
  await startDrag(page, 4)
  const target = await center(page, 1)
  await page.mouse.move(target.x, target.y - 10, { steps: 8 })
  await expect.poll(() => panelNames(page)).toEqual(['Vendas', 'Impressões', 'Cliques', 'Leads'])
  expect(await funnel.innerText()).toBe(before)
  await page.mouse.up()
  await expect.poll(() => funnel.innerText()).not.toBe(before)
})

test('extra: a cópia do cabeçalho acompanha o ponteiro e mostra o nome da etapa', async ({ page }) => {
  await startDrag(page, 4)
  const ghost = page.locator('.stage-ghost')
  await expect(ghost.locator('.stage-name')).toHaveText('Vendas')
  const y1 = (await ghost.boundingBox())!.y
  const box = (await handle(page, 4).boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y - 120, { steps: 6 })
  await expect.poll(async () => (await ghost.boundingBox())!.y).toBeLessThan(y1 - 100)
  await page.mouse.up()
  await expect(ghost).toHaveCount(0)
})

test('extra: arrastar perto da borda de cima da barra a rola para cima', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 500 })
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Adicionar etapa' }).click()
  const sidebar = page.locator('.sidebar')
  await sidebar.evaluate((el) => el.scrollTo(0, el.scrollHeight))
  const start = await sidebar.evaluate((el) => el.scrollTop)
  expect(start).toBeGreaterThan(0)
  await handle(page, 10).scrollIntoViewIfNeeded()
  await startDrag(page, 10)
  const box = (await sidebar.boundingBox())!
  await page.mouse.move(box.x + 100, box.y + 5, { steps: 5 })
  await expect.poll(() => sidebar.evaluate((el) => el.scrollTop), { timeout: 3000 }).toBeLessThan(start)
  await page.keyboard.press('Escape')
  await page.mouse.up()
})

test('extra: depois da rolagem automática, soltar põe a etapa onde a lista mostra', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 500 })
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Adicionar etapa' }).click()
  const sidebar = page.locator('.sidebar')
  await sidebar.evaluate((el) => el.scrollTo(0, 0))
  await startDrag(page, 1)
  const box = (await sidebar.boundingBox())!
  await page.mouse.move(box.x + 100, box.y + box.height - 5, { steps: 5 })
  await expect.poll(() => sidebar.evaluate((el) => el.scrollTop), { timeout: 3000 }).toBeGreaterThan(100)
  // Pointer back to a stage in the middle of the visible list, then drop there.
  const stages = page.locator('.stages')
  const sbox = (await stages.boundingBox())!
  const y = Math.max(box.y + 80, sbox.y + 10)
  await page.mouse.move(box.x + 100, y, { steps: 3 })
  const preview = await panelNames(page)
  await page.mouse.up()
  await expect.poll(() => bandNames(page)).toEqual(preview)
  expect(preview[0]).not.toBe('Impressões')
})

test('extra: tela estreita, Esc durante o arraste cancela e não fecha a barra', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await toggle(page).click()
  await expect(panel(page)).toBeVisible()
  await startDrag(page, 4)
  const target = await center(page, 1)
  await page.mouse.move(target.x, target.y - 10, { steps: 8 })
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await expect(panel(page)).toBeVisible()
  await expect.poll(() => panelNames(page)).toEqual(['Impressões', 'Cliques', 'Leads', 'Vendas'])
})

test('extra: toque solto fora da lista cancela', async ({ page }) => {
  const from = (await handle(page, 4).boundingBox())!
  await handle(page, 4).evaluate(async (el, from) => {
    const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
    const opts = { bubbles: true, pointerId: 9, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1 }
    const x = from.x + from.width / 2
    el.dispatchEvent(new PointerEvent('pointerdown', { ...opts, clientX: x, clientY: from.y + 5 }))
    await frame()
    window.dispatchEvent(new PointerEvent('pointermove', { ...opts, clientX: x, clientY: 60 }))
    await frame()
    window.dispatchEvent(new PointerEvent('pointermove', { ...opts, clientX: 900, clientY: 500 }))
    await frame()
    window.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0, clientX: 900, clientY: 500 }))
  }, from)
  await expect.poll(() => panelNames(page)).toEqual(['Impressões', 'Cliques', 'Leads', 'Vendas'])
  expect(await bandNames(page)).toEqual(['Impressões', 'Cliques', 'Leads', 'Vendas'])
  expect(await isOpen(page, 1)).toBe('true')
})

test('extra: toque interrompido pelo navegador (pointercancel) cancela', async ({ page }) => {
  const from = (await handle(page, 4).boundingBox())!
  const first = (await group(page, 1).boundingBox())!
  await handle(page, 4).evaluate(
    async (el, { from, top }) => {
      const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
      const opts = { bubbles: true, pointerId: 11, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1 }
      const x = from.x + from.width / 2
      el.dispatchEvent(new PointerEvent('pointerdown', { ...opts, clientX: x, clientY: from.y + 5 }))
      await frame()
      window.dispatchEvent(new PointerEvent('pointermove', { ...opts, clientX: x, clientY: top + 10 }))
      await frame()
      window.dispatchEvent(new PointerEvent('pointercancel', { ...opts, buttons: 0, clientX: x, clientY: top + 10 }))
    },
    { from, top: first.y },
  )
  await expect.poll(() => panelNames(page)).toEqual(['Impressões', 'Cliques', 'Leads', 'Vendas'])
  expect(await bandNames(page)).toEqual(['Impressões', 'Cliques', 'Leads', 'Vendas'])
})

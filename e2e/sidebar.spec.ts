import { expect, test, type Page } from '@playwright/test'

const panel = (page: Page) => page.getByRole('complementary', { name: 'Painel do funil' })
const funnel = (page: Page) => page.getByRole('region', { name: 'Funil' })
const toggle = (page: Page) => page.getByRole('banner').getByRole('button', { name: /edição/ })

test('tela larga: a barra cobre o funil, colada à esquerda, sem mudar a largura dele', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 })
  await page.goto('/')
  const side = (await page.locator('.sidebar').boundingBox())!
  const open = (await funnel(page).boundingBox())!
  expect(side.x).toBe(0)
  expect(open.x).toBeLessThan(side.x + side.width) // a barra fica por cima do funil

  // Sem fundo escurecido: clicar no funil fora das faixas (à vista) não fecha.
  await page.mouse.click(1100, 600)
  await expect(panel(page)).toBeVisible()

  await toggle(page).click()
  await expect(panel(page)).toBeHidden()
  const closed = (await funnel(page).boundingBox())!
  expect(closed).toEqual(open)
})

test('cabeçalho de ponta a ponta: botão da barra à esquerda e configurações à direita', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 800 })
  await page.goto('/')
  const button = (await toggle(page).boundingBox())!
  const settings = (await page.getByRole('button', { name: 'Configurações' }).boundingBox())!
  expect(button.x).toBe(24)
  expect(settings.x + settings.width).toBe(1600 - 24)
})

test('tela larga: a barra rola por conta própria e a página fica parada', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 600 })
  await page.goto('/')
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Adicionar etapa' }).click()
  const band = page.getByRole('button', { name: 'Editar etapa Etapa 10' })
  // A faixa fica abaixo da janela: primeiro ela vem à vista, e a barra volta ao topo.
  await band.scrollIntoViewIfNeeded()
  await panel(page).evaluate((el) => el.closest('.sidebar')!.scrollTo(0, 0))
  const pageScroll = await page.evaluate(() => window.scrollY)
  await band.click()
  await expect(page.getByRole('group', { name: 'Etapa 10' }).getByLabel('Nome')).toBeFocused()
  await expect.poll(() => panel(page).evaluate((el) => el.closest('.sidebar')!.scrollTop)).toBeGreaterThan(0)
  await page.waitForTimeout(500)
  expect(await page.evaluate(() => window.scrollY)).toBe(pageScroll)
})

test('tela estreita: começa fechada mesmo com "aberta" salvo, e abre por cima do funil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => localStorage.setItem('analisador-de-funil:edicao', 'aberta'))
  await page.goto('/')
  await expect(panel(page)).toBeHidden()
  const before = (await funnel(page).boundingBox())!

  await toggle(page).click()
  await expect(panel(page)).toBeVisible()
  await expect(page.getByLabel('Verba de mídia (R$)')).toBeFocused()
  const after = (await funnel(page).boundingBox())!
  expect(after.x).toBe(before.x)
  expect(after.width).toBe(before.width)
})

test('tela estreita: tocar no fundo escurecido fecha', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await toggle(page).click()
  await expect(panel(page)).toBeVisible()
  await page.mouse.click(380, 400) // na faixa à direita, sobre o fundo
  await expect(panel(page)).toBeHidden()
})

test('tela estreita: o botão do cabeçalho continua visível e fecha a barra', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await toggle(page).click()
  await expect(panel(page)).toBeVisible()
  await expect(toggle(page)).toHaveAccessibleName('Fechar edição')
  await toggle(page).click() // um clique real: falha se a barra ou o fundo cobrirem o botão
  await expect(panel(page)).toBeHidden()
})

test('tela estreita: Tab fica entre o botão do cabeçalho e a barra, e Esc fecha', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await toggle(page).click()
  await expect(page.getByLabel('Verba de mídia (R$)')).toBeFocused()
  let reachedButton = false
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab')
    const where = await page.evaluate(() => {
      const el = document.activeElement
      if (el?.closest('[aria-label="Painel do funil"]')) return 'barra'
      if (el?.closest('header') && el.getAttribute('aria-label') === 'Fechar edição') return 'botão'
      return 'fora'
    })
    expect(where).not.toBe('fora')
    if (where === 'botão') reachedButton = true
  }
  expect(reachedButton).toBe(true)
  await page.getByLabel('Verba de mídia (R$)').focus()
  await page.keyboard.press('Escape')
  await expect(panel(page)).toBeHidden()
  await expect(toggle(page)).toBeFocused()
})

test('fechada, a barra não é alcançável pelo Tab', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 })
  await page.goto('/')
  await toggle(page).click()
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab')
    const inside = await page.evaluate(() => !!document.activeElement?.closest('.sidebar'))
    expect(inside).toBe(false)
  }
})

test('tela estreita: abrir ou fechar não muda o que fica lembrado para a tela larga', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 })
  await page.goto('/')
  await toggle(page).click() // fecha em tela larga: fica lembrado
  await page.setViewportSize({ width: 390, height: 844 })
  await toggle(page).click() // abre no celular: não deve ser lembrado
  await expect(panel(page)).toBeVisible()
  await page.setViewportSize({ width: 1200, height: 800 })
  await page.reload()
  await expect(panel(page)).toBeHidden()
})

test('tela estreita: Esc com o foco no botão do cabeçalho também fecha', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await toggle(page).click()
  await expect(panel(page)).toBeVisible()
  await toggle(page).focus()
  await page.keyboard.press('Escape')
  await expect(panel(page)).toBeHidden()
  await expect(toggle(page)).toBeFocused()
})

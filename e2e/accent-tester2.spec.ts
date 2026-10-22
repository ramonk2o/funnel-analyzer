import { expect, test } from '@playwright/test'

const KEY = 'analisador-de-funil:destaque'
const accent = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.style.getPropertyValue('--accent'))

test('saved "personalizada" with an invalid hex: the pre-app script paints nothing (violet stays)', async ({ page }) => {
  await page.addInitScript((key) =>
    localStorage.setItem(key, JSON.stringify({ cor: 'personalizada', personalizada: 'zzz', vars: { dark: { '--accent': '#ff0000' } } })),
  KEY)
  await page.route('**/src/main.tsx*', (route) => route.abort())
  await page.goto('/')
  expect(await accent(page)).toBe('')
})

test('with localStorage blocked, choosing a color works in the session', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked') } })
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Configurações' }).click()
  await page.getByRole('dialog', { name: 'Configurações' }).getByTitle('Rosa').click()
  expect(await accent(page)).toBe('#f472b6')
})

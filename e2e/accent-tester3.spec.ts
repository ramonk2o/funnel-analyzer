import { expect, test } from '@playwright/test'

const KEY = 'analisador-de-funil:destaque'
const accent = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.style.getPropertyValue('--accent'))

// The app only takes a string hex (loadAccent); the pre-app script must refuse the same values.
for (const personalizada of [123, ['abc'], 'abc ', ' #ABC']) {
  test(`saved "personalizada" = ${JSON.stringify(personalizada)}: the script paints only if the app would accept it`, async ({ page }) => {
    await page.addInitScript(
      ([key, value]) =>
        localStorage.setItem(key as string, JSON.stringify({ cor: 'personalizada', personalizada: value, vars: { dark: { '--accent': '#ff0000' } } })),
      [KEY, personalizada],
    )
    await page.route('**/src/main.tsx*', (route) => route.abort())
    await page.goto('/')
    const appAccepts = typeof personalizada === 'string'
    expect(await accent(page)).toBe(appAccepts ? '#ff0000' : '')
  })
}

test('saved ready color without vars: the script paints nothing and does not break the theme', async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem('analisador-de-funil:tema', 'light')
    localStorage.setItem(key, JSON.stringify({ cor: 'azul' }))
  }, KEY)
  await page.route('**/src/main.tsx*', (route) => route.abort())
  await page.goto('/')
  expect(await accent(page)).toBe('')
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('light')
})

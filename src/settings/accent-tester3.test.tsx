import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { texts } from '../texts'
import { contrastRatio } from '../theme/contrast'
import { ACCENT_IDS, ACCENT_STORAGE_KEY, accentColors, customAccent, PRESETS, THEME_BACKGROUNDS } from './accent'

const s = texts.settings
const a = texts.settings.accent

beforeEach(() => {
  delete document.documentElement.dataset.theme
  document.documentElement.removeAttribute('style')
  localStorage.clear()
})

const user = () => userEvent.setup()
const modal = () => within(screen.getByRole('dialog', { name: s.title }))
const group = () => within(modal().getByRole('group', { name: a.label }))
const option = (name: string) => group().getByRole('radio', { name })
const hexField = () => group().getByRole('textbox', { name: a.hex })
const accentInUse = () => document.documentElement.style.getPropertyValue('--accent')
const openSettings = () => user().click(screen.getByRole('button', { name: s.open }))

test('spaces around a typed hex are ignored in the field', async () => {
  render(<App />)
  await openSettings()
  await user().click(option(a.custom))
  await user().clear(hexField())
  await user().click(hexField())
  await user().paste('  #22c55e  ')
  expect(hexField()).not.toHaveAttribute('aria-invalid')
  expect(accentInUse()).toBe(customAccent('#22c55e', 'dark').accent)
})

test('the ready-color swatches have no visible text', async () => {
  render(<App />)
  await openSettings()
  for (const id of ACCENT_IDS) expect(option(a.names[id]).closest('label')!.textContent).toBe('')
})

test('a saved custom color adjusted on the light theme shows the notice as soon as the modal opens', async () => {
  localStorage.setItem('analisador-de-funil:tema', 'light')
  localStorage.setItem(ACCENT_STORAGE_KEY, JSON.stringify({ cor: 'personalizada', personalizada: '#ffff00' }))
  render(<App />)
  await openSettings()
  expect(hexField()).toHaveValue('#ffff00')
  expect(modal().getByRole('radio', { name: s.light })).toBeChecked()
  expect(group().getByText(a.adjusted)).toBeInTheDocument()
})

test('Tab reaches the hex field and the color picker, and focus stays in the modal', async () => {
  render(<App />)
  await openSettings()
  await user().click(option(a.custom))
  const reached = new Set<Element | null>()
  for (let i = 0; i < 12; i++) {
    await user().tab()
    reached.add(document.activeElement)
    expect(screen.getByRole('dialog', { name: s.title }).contains(document.activeElement)).toBe(true)
  }
  expect(reached.has(hexField())).toBe(true)
  expect(reached.has(group().getByLabelText(a.picker))).toBe(true)
})

// "todo fundo": the accent text also sits on --accent-soft tints (funnel.css, compare.css, funnels.css).
function over(fg: string, alpha: number, bg: string) {
  const c = (hex: string, i: number) => parseInt(hex.slice(i, i + 2), 16)
  return `#${[1, 3, 5].map((i) => Math.round(c(fg, i) * alpha + c(bg, i) * (1 - alpha)).toString(16).padStart(2, '0')).join('')}`
}
// Text painted on the tint (.investment-value, .compare-best) uses --accent-strong.
test('strong (ready and custom) reads at 4.5:1 on the accent-soft tint over every background', () => {
  const soft = { dark: 0.14, light: 0.1 } as const
  const customs = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff', '#ffffff', '#000000', '#808080', '#7c3aed', '#123456', '#fedcba']
  const fails: string[] = []
  const choices = [...ACCENT_IDS.map((id) => ({ id, custom: null })), ...customs.map((c) => ({ id: 'custom' as const, custom: c }))]
  for (const choice of choices) {
    for (const theme of ['dark', 'light'] as const) {
      const { accent, strong } = accentColors(choice, theme)
      for (const bg of THEME_BACKGROUNDS[theme]) {
        const r = contrastRatio(strong, over(accent, soft[theme], bg))
        if (r < 4.5) fails.push(`${choice.custom ?? choice.id} ${theme} strong on soft/${bg}: ${r.toFixed(2)}`)
      }
    }
  }
  expect(fails).toEqual([])
})

test('PRESETS dark and light are distinct per color', () => {
  for (const id of ACCENT_IDS) expect(PRESETS[id].dark.accent).not.toBe(PRESETS[id].light.accent)
})

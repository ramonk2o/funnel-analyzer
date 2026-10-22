import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { texts } from '../texts'
import { ACCENT_STORAGE_KEY, customAccent, parseHex, PRESETS } from './accent'

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
const picker = () => group().getByLabelText(a.picker)
const accentInUse = () => document.documentElement.style.getPropertyValue('--accent')
const openSettings = () => user().click(screen.getByRole('button', { name: s.open }))
async function replace(input: HTMLElement, value: string) {
  await user().clear(input)
  await user().click(input)
  await user().paste(value)
}

test('a ready color saved with a last custom hex: after reopening the app, Personalizada brings it back', async () => {
  localStorage.setItem(ACCENT_STORAGE_KEY, JSON.stringify({ cor: 'azul', personalizada: '#123456' }))
  render(<App />)
  await openSettings()
  expect(option(a.names.blue)).toBeChecked()
  await user().click(option(a.custom))
  expect(hexField()).toHaveValue('#123456')
  expect(accentInUse()).toBe(customAccent('#123456', 'dark').accent)
})

test('invalid text, then the picker: the field takes the picker value and is valid again', async () => {
  render(<App />)
  await openSettings()
  await user().click(option(a.custom))
  await replace(hexField(), 'xyz')
  fireEvent.input(picker(), { target: { value: '#abcdef' } })
  expect(hexField()).toHaveValue('#abcdef')
  expect(hexField()).not.toHaveAttribute('aria-invalid')
  expect(accentInUse()).toBe(customAccent('#abcdef', 'dark').accent)
})

test('invalid text, then a theme switch with the modal open: the last valid color is used on the new theme', async () => {
  render(<App />)
  await openSettings()
  await user().click(option(a.custom))
  await replace(hexField(), '#ffff00')
  await replace(hexField(), '#ffff0')
  await user().click(modal().getByRole('radio', { name: s.light }))
  expect(accentInUse()).toBe(customAccent('#ffff00', 'light').accent)
  expect(group().getByText(a.adjusted)).toBeInTheDocument()
})

test('Escape with the field invalid also discards the text', async () => {
  render(<App />)
  await openSettings()
  await user().click(option(a.custom))
  await replace(hexField(), '#abc')
  await replace(hexField(), '#ab')
  await user().keyboard('{Escape}')
  await openSettings()
  expect(hexField()).toHaveValue('#aabbcc')
})

test('first time Personalizada from a non-violet ready color on the light theme starts from that color dark version', async () => {
  render(<App />)
  await openSettings()
  await user().click(modal().getByRole('radio', { name: s.light }))
  await user().click(option(a.names.orange))
  await user().click(option(a.custom))
  expect(hexField()).toHaveValue(PRESETS.orange.dark.accent)
  // The starting color is then used, adjusted for the light theme if needed.
  expect(accentInUse()).toBe(customAccent(PRESETS.orange.dark.accent, 'light').accent)
})

test('"#73E" and "73e" become #7733ee; 4, 5, 7 or 8 digits are refused', () => {
  expect(parseHex('#73E')).toBe('#7733ee')
  expect(parseHex('73e')).toBe('#7733ee')
  for (const bad of ['#7c3a', '#7c3ae', '#7c3aedd', '#7c3aedff', '##7c3aed', '#ggg', '']) expect(parseHex(bad), bad).toBeNull()
})

test('extremes: white on dark, black on light keep a valid accent; strong may equal accent', () => {
  const dark = customAccent('#ffffff', 'dark')
  expect(dark.accent).toBe('#ffffff')
  expect(dark.adjusted).toBe(false)
  const light = customAccent('#000000', 'light')
  expect(light.accent).toBe('#000000')
  expect(light.adjusted).toBe(false)
})

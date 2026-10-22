import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { texts } from '../texts'
import { customAccent, PRESETS } from './accent'

const s = texts.settings
const a = texts.settings.accent

beforeEach(() => {
  delete document.documentElement.dataset.theme
  document.documentElement.removeAttribute('style')
})

const user = () => userEvent.setup()
const modal = () => within(screen.getByRole('dialog', { name: s.title }))
const group = () => within(modal().getByRole('group', { name: a.label }))
const option = (name: string) => group().getByRole('radio', { name })
const hexField = () => group().getByRole('textbox', { name: a.hex })
const queryHexField = () => group().queryByRole('textbox', { name: a.hex })
const picker = () => group().getByLabelText(a.picker)
const sample = () => group().getByRole('img', { name: a.sample })
const accentInUse = () => document.documentElement.style.getPropertyValue('--accent')

function rgb(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return `rgb(${r}, ${g}, ${b})`
}

async function openSettings() {
  await user().click(screen.getByRole('button', { name: s.open }))
}
// Pastes the whole value: typing it would pass through shorter valid colors ("#7c3" on the way to "#7c3aed").
async function replace(input: HTMLElement, value: string) {
  await user().clear(input)
  if (value) {
    await user().click(input)
    await user().paste(value)
  }
}

test('o grupo "Cor de destaque" fica entre o tema e o separador, com o Violeta marcado', async () => {
  render(<App />)
  await openSettings()
  const legends = modal()
    .getAllByRole('group')
    .map((g) => g.querySelector('legend')!.textContent)
  expect(legends).toEqual([s.theme, a.label, s.separator])
  const names = group()
    .getAllByRole('radio')
    .map((r) => r.getAttribute('aria-label') ?? r.closest('label')!.textContent)
  expect(names).toEqual([a.names.violet, a.names.blue, a.names.green, a.names.orange, a.names.pink, a.custom])
  expect(option(a.names.violet)).toBeChecked()
  // The swatches have no visible text: the name is also the hint on hover.
  expect(option(a.names.blue).closest('label')).toHaveAttribute('title', a.names.blue)
  expect(queryHexField()).toBeNull()
})

test('marcar Azul troca a cor na hora, com o modal aberto; trocar o tema usa o Azul do outro tema', async () => {
  render(<App />)
  await openSettings()
  await user().click(option(a.names.blue))
  expect(screen.getByRole('dialog', { name: s.title })).toBeInTheDocument()
  expect(accentInUse()).toBe(PRESETS.blue.dark.accent)
  expect(document.documentElement.style.getPropertyValue('--accent-strong')).toBe(PRESETS.blue.dark.strong)

  await user().click(modal().getByRole('radio', { name: s.light }))
  expect(accentInUse()).toBe(PRESETS.blue.light.accent)
})

describe('personalizada', () => {
  test('o campo começa com o hexadecimal da cor marcada, na versão do tema escuro', async () => {
    render(<App />)
    await openSettings()
    await user().click(modal().getByRole('radio', { name: s.light }))
    await user().click(option(a.names.green))
    await user().click(option(a.custom))
    expect(hexField()).toHaveValue(PRESETS.green.dark.accent)
  })

  test('um hexadecimal válido vale na hora; um inválido marca o campo e mantém a última cor válida', async () => {
    render(<App />)
    await openSettings()
    await user().click(option(a.custom))
    await replace(hexField(), '#7C3AED')
    expect(accentInUse()).toBe(customAccent('#7c3aed', 'dark').accent)
    expect(hexField()).not.toHaveAttribute('aria-invalid')

    await replace(hexField(), '#7c3ae')
    expect(hexField()).toHaveValue('#7c3ae')
    expect(hexField()).toHaveAttribute('aria-invalid', 'true')
    expect(accentInUse()).toBe(customAccent('#7c3aed', 'dark').accent)

    await replace(hexField(), '22c55e')
    expect(accentInUse()).toBe(customAccent('#22c55e', 'dark').accent)
  })

  test('o seletor de cor e o campo de texto andam juntos', async () => {
    render(<App />)
    await openSettings()
    await user().click(option(a.custom))
    fireEvent.input(picker(), { target: { value: '#123abc' } })
    expect(hexField()).toHaveValue('#123abc')
    expect(accentInUse()).toBe(customAccent('#123abc', 'dark').accent)

    await replace(hexField(), '#f0a')
    expect(picker()).toHaveValue('#ff00aa')
  })

  test('voltar para uma cor pronta e de novo para Personalizada traz o último hexadecimal válido', async () => {
    render(<App />)
    await openSettings()
    await user().click(option(a.custom))
    await replace(hexField(), '#22c55e')
    await replace(hexField(), '#22c55')
    await user().click(option(a.names.pink))
    expect(accentInUse()).toBe(PRESETS.pink.dark.accent)
    expect(queryHexField()).toBeNull()
    await user().click(option(a.custom))
    expect(hexField()).toHaveValue('#22c55e')
  })

  test('o aviso de ajuste aparece só quando a cor foi ajustada no tema atual; a amostra mostra a cor em uso', async () => {
    render(<App />)
    await openSettings()
    await user().click(option(a.custom))
    // Yellow reads well on the dark theme, not on the light one.
    await replace(hexField(), '#ffff00')
    expect(group().queryByText(a.adjusted)).toBeNull()
    expect(sample().style.backgroundColor).toBe(rgb('#ffff00'))

    await user().click(modal().getByRole('radio', { name: s.light }))
    expect(group().getByText(a.adjusted)).toBeInTheDocument()
    const adjusted = customAccent('#ffff00', 'light').accent
    expect(accentInUse()).toBe(adjusted)
    expect(sample().style.backgroundColor).toBe(rgb(adjusted))
    expect(hexField()).toHaveValue('#ffff00')

    await user().click(modal().getByRole('radio', { name: s.dark }))
    expect(group().queryByText(a.adjusted)).toBeNull()
  })

  test('a escolha fica salva no navegador', async () => {
    render(<App />)
    await openSettings()
    await user().click(option(a.custom))
    await replace(hexField(), '#123456')
    const saved = localStorage.getItem('analisador-de-funil:destaque')
    expect(saved).not.toBeNull()
    expect(saved).toContain('#123456')
  })

  test('fechar com o campo inválido descarta o texto: ao reabrir, aparece o último hexadecimal válido', async () => {
    render(<App />)
    await openSettings()
    await user().click(option(a.custom))
    await replace(hexField(), '#123456')
    await replace(hexField(), '#12345')
    await user().click(modal().getByRole('button', { name: s.close }))
    await openSettings()
    expect(hexField()).toHaveValue('#123456')
    expect(hexField()).not.toHaveAttribute('aria-invalid')
  })
})

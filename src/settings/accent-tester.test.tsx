import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import tokensCss from '../styles/tokens.css?raw'
import { texts } from '../texts'
import { contrastRatio } from '../theme/contrast'
import {
  ACCENT_STORAGE_KEY,
  accentVars,
  customAccent,
  PRESETS,
  saveAccent,
  THEME_BACKGROUNDS,
} from './accent'

const s = texts.settings
const a = texts.settings.accent
const THEMES = ['dark', 'light'] as const

function hsl(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  const l = (max + min) / 2
  const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h = (h * 60 + 360) % 360
  }
  return { h, s: sat, l }
}
const hueDistance = (x: number, y: number) => Math.min(Math.abs(x - y), 360 - Math.abs(x - y))
const minContrast = (color: string, theme: 'dark' | 'light') =>
  Math.min(...THEME_BACKGROUNDS[theme].map((bg) => contrastRatio(color, bg)))

// Deterministic pseudo-random colors.
function randomHexes(count: number) {
  let seed = 12345
  const next = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31)
  return Array.from({ length: count }, () => `#${(next() % 0x1000000).toString(16).padStart(6, '0')}`)
}

describe('cor personalizada (testes extras)', () => {
  test('qualquer cor: destaque e forte passam no contraste nos dois temas; o forte vai para o lado certo', () => {
    for (const hex of randomHexes(600)) {
      for (const theme of THEMES) {
        const r = customAccent(hex, theme)
        expect(minContrast(r.accent, theme), `${hex} ${theme} destaque`).toBeGreaterThanOrEqual(4.5)
        expect(minContrast(r.strong, theme), `${hex} ${theme} forte`).toBeGreaterThanOrEqual(4.5)
        if (theme === 'dark') expect(hsl(r.strong).l, hex).toBeGreaterThanOrEqual(hsl(r.accent).l)
        else expect(hsl(r.strong).l, hex).toBeLessThanOrEqual(hsl(r.accent).l)
        // "adjusted" means exactly that the color changed.
        expect(r.adjusted, hex).toBe(r.accent !== hex)
      }
    }
  })

  test('qualquer cor saturada: o ajuste mantém o matiz (até 15°) nos dois temas', () => {
    for (const hex of randomHexes(600)) {
      const original = hsl(hex)
      if (original.s < 0.3 || original.l < 0.1 || original.l > 0.9) continue
      for (const theme of THEMES) {
        const r = customAccent(hex, theme)
        expect(hueDistance(hsl(r.accent).h, original.h), `${hex} ${theme} -> ${r.accent}`).toBeLessThanOrEqual(15)
      }
    }
  })

  test('uma cor que já passa no contraste não é mexida', () => {
    for (const hex of randomHexes(600)) {
      for (const theme of THEMES) {
        if (minContrast(hex, theme) >= 4.5) expect(customAccent(hex, theme), `${hex} ${theme}`).toMatchObject({ accent: hex, adjusted: false })
      }
    }
  })

  test('a versão do tema claro é mais escura que a do escuro', () => {
    for (const hex of randomHexes(300)) {
      expect(hsl(customAccent(hex, 'light').accent).l, hex).toBeLessThan(hsl(customAccent(hex, 'dark').accent).l)
    }
  })
})

describe('variáveis geradas (testes extras)', () => {
  test('o Violeta gera exatamente os valores de hoje em tokens.css, nos dois temas', () => {
    for (const theme of THEMES) {
      const block = tokensCss.match(new RegExp(`\\[data-theme='${theme}'\\][^{]*\\{([^}]*)\\}`))![1]
      const vars = accentVars({ id: 'violet', custom: null }, theme)
      for (const [name, value] of Object.entries(vars)) {
        const css = block.match(new RegExp(`${name}:\\s*([^;]+);`))![1].trim()
        expect(value.replace(/\s/g, '').toLowerCase(), `${theme} ${name}`).toBe(css.replace(/\s/g, '').toLowerCase())
      }
    }
  })

  test('fundos translúcidos, brilho e grade de uma personalizada partem da cor ajustada', () => {
    const adjusted = customAccent('#ffff00', 'light').accent
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(adjusted.slice(i, i + 2), 16))
    const vars = accentVars({ id: 'custom', custom: '#ffff00' }, 'light')
    for (const name of ['--accent-soft', '--glow', '--grid']) expect(vars[name]).toContain(`rgba(${r}, ${g}, ${b},`)
  })

  test('o valor salvo traz as variáveis dos dois temas que o index.html aplica', () => {
    const choice = { id: 'custom' as const, custom: '#ffff00' }
    saveAccent(choice, localStorage)
    const saved = JSON.parse(localStorage.getItem(ACCENT_STORAGE_KEY)!)
    expect(saved.vars.dark).toEqual(accentVars(choice, 'dark'))
    expect(saved.vars.light).toEqual(accentVars(choice, 'light'))
  })
})

describe('tela (testes extras)', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.theme
    document.documentElement.removeAttribute('style')
  })
  afterEach(() => vi.restoreAllMocks())

  const user = () => userEvent.setup()
  const modal = () => within(screen.getByRole('dialog', { name: s.title }))
  const group = () => within(modal().getByRole('group', { name: a.label }))
  const option = (name: string) => group().getByRole('radio', { name })
  const hexField = () => group().getByRole('textbox', { name: a.hex })
  const picker = () => group().getByLabelText(a.picker)
  const accentInUse = () => document.documentElement.style.getPropertyValue('--accent')
  const openSettings = async () => user().click(screen.getByRole('button', { name: s.open }))
  async function replace(input: HTMLElement, value: string) {
    await user().clear(input)
    if (value) {
      await user().click(input)
      await user().paste(value)
    }
  }

  test('na primeira vez, sem cor pronta trocada, o campo começa com o Violeta do escuro, mesmo no tema claro', async () => {
    render(<App />)
    await openSettings()
    await user().click(modal().getByRole('radio', { name: s.light }))
    await user().click(option(a.custom))
    expect(hexField()).toHaveValue(PRESETS.violet.dark.accent)
    expect(accentInUse()).toBe(customAccent(PRESETS.violet.dark.accent, 'light').accent)
  })

  test('um valor salvo inválido volta para o Violeta na tela', async () => {
    localStorage.setItem(ACCENT_STORAGE_KEY, JSON.stringify({ cor: 'personalizada', personalizada: 'nope' }))
    render(<App />)
    expect(accentInUse()).toBe(PRESETS.violet.dark.accent)
    await openSettings()
    expect(option(a.names.violet)).toBeChecked()
  })

  test('uma escolha salva é lida ao abrir o app', async () => {
    saveAccent({ id: 'orange', custom: null }, localStorage)
    render(<App />)
    expect(accentInUse()).toBe(PRESETS.orange.dark.accent)
    await openSettings()
    expect(option(a.names.orange)).toBeChecked()
  })

  test('com o armazenamento bloqueado, a troca de cor funciona na sessão', async () => {
    const original = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === ACCENT_STORAGE_KEY) throw new Error('blocked')
      return original.call(this, key, value)
    })
    render(<App />)
    await openSettings()
    await user().click(option(a.names.pink))
    expect(accentInUse()).toBe(PRESETS.pink.dark.accent)
    expect(option(a.names.pink)).toBeChecked()
    await user().click(option(a.custom))
    await replace(hexField(), '#123456')
    expect(accentInUse()).toBe(customAccent('#123456', 'dark').accent)
  })

  test('voltar para Personalizada aplica na hora o último hexadecimal válido', async () => {
    render(<App />)
    await openSettings()
    await user().click(option(a.custom))
    await replace(hexField(), '#22c55e')
    await user().click(option(a.names.blue))
    expect(accentInUse()).toBe(PRESETS.blue.dark.accent)
    await user().click(option(a.custom))
    expect(accentInUse()).toBe(customAccent('#22c55e', 'dark').accent)
  })

  test('com o campo inválido, o seletor de cor mostra a última cor válida', async () => {
    render(<App />)
    await openSettings()
    await user().click(option(a.custom))
    await replace(hexField(), '#22c55e')
    await replace(hexField(), '#22c5')
    expect(hexField()).toHaveAttribute('aria-invalid', 'true')
    expect(picker()).toHaveValue('#22c55e')
  })

  test('formas aceitas no campo: sem #, curta e maiúsculas', async () => {
    render(<App />)
    await openSettings()
    await user().click(option(a.custom))
    for (const [typed, hex] of [
      ['7C3AED', '#7c3aed'],
      ['#73E', '#7733ee'],
      ['abc', '#aabbcc'],
    ]) {
      await replace(hexField(), typed)
      expect(hexField(), typed).not.toHaveAttribute('aria-invalid')
      expect(accentInUse(), typed).toBe(customAccent(hex, 'dark').accent)
    }
  })

  test('um campo vazio fica marcado como inválido e mantém a cor', async () => {
    render(<App />)
    await openSettings()
    await user().click(option(a.custom))
    await replace(hexField(), '#22c55e')
    await replace(hexField(), '')
    expect(hexField()).toHaveAttribute('aria-invalid', 'true')
    expect(accentInUse()).toBe(customAccent('#22c55e', 'dark').accent)
  })
})

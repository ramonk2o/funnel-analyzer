import { texts } from '../texts'
import { contrastRatio } from '../theme/contrast'
import type { Theme } from '../theme/theme'

export const ACCENT_IDS = ['violet', 'blue', 'green', 'orange', 'pink'] as const
export type AccentId = (typeof ACCENT_IDS)[number]

export interface AccentChoice {
  id: AccentId | 'custom'
  /** The last valid custom color (#rrggbb), kept while a ready color is chosen; null until one is set. */
  custom: string | null
}

export interface AccentColors {
  accent: string
  strong: string
  /** A custom color whose lightness had to change to read well on this theme. */
  adjusted: boolean
}

export const ACCENT_STORAGE_KEY = texts.settings.accent.storageKey

/** Page, card and button backgrounds of each theme (the same as tokens.css): text must read on all. */
export const THEME_BACKGROUNDS: Record<Theme, string[]> = {
  dark: ['#0a0a0f', '#12121a', '#191924'],
  light: ['#f5f5fa', '#ffffff', '#efeff6'],
}

const MIN_CONTRAST = 4.5

// Each ready color has a version per theme, darker on the light one; violet is the original.
export const PRESETS: Record<AccentId, Record<Theme, { accent: string; strong: string }>> = {
  violet: { dark: { accent: '#a78bfa', strong: '#c4b5fd' }, light: { accent: '#6d28d9', strong: '#5b21b6' } },
  blue: { dark: { accent: '#60a5fa', strong: '#93c5fd' }, light: { accent: '#1d4ed8', strong: '#1e40af' } },
  green: { dark: { accent: '#4ade80', strong: '#86efac' }, light: { accent: '#166534', strong: '#14532d' } },
  orange: { dark: { accent: '#fb923c', strong: '#fdba74' }, light: { accent: '#c2410c', strong: '#9a3412' } },
  pink: { dark: { accent: '#f472b6', strong: '#f9a8d4' }, light: { accent: '#be185d', strong: '#9d174d' } },
}

/** A typed color as #rrggbb ("#7c3aed", "7C3AED", "#73e"), or null if it isn't one. */
export function parseHex(text: string): string | null {
  const match = text.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!match) return null
  const digits = match[1].toLowerCase()
  return `#${digits.length === 3 ? [...digits].map((d) => d + d).join('') : digits}`
}

const readsWell = (color: string, theme: Theme) =>
  THEME_BACKGROUNDS[theme].every((bg) => contrastRatio(color, bg) >= MIN_CONTRAST)

/**
 * A custom color on a theme: the same hue, with only its lightness moved (up on the dark theme,
 * down on the light one) until it reads well. The strong version goes further the same way.
 */
export function customAccent(hex: string, theme: Theme): AccentColors {
  const { h, s, l } = toHsl(hex)
  const step = theme === 'dark' ? 0.01 : -0.01
  let lightness = l
  let accent = hex
  const canMove = () => (theme === 'dark' ? lightness < 1 : lightness > 0)
  while (!readsWell(accent, theme) && canMove()) {
    lightness = Math.min(1, Math.max(0, lightness + step))
    accent = toHex(h, s, lightness)
  }
  const strongLightness = theme === 'dark' ? Math.min(1, lightness + 0.1) : Math.max(0, lightness - 0.08)
  return { accent, strong: toHex(h, s, strongLightness), adjusted: accent !== hex }
}

/** The colors in use: the ready color's version for the theme, or the adjusted custom one. */
export function accentColors(choice: AccentChoice, theme: Theme): AccentColors {
  if (choice.id === 'custom' && choice.custom) return customAccent(choice.custom, theme)
  const preset = PRESETS[choice.id === 'custom' ? 'violet' : choice.id][theme]
  return { ...preset, adjusted: false }
}

// See-through versions, as in tokens.css: soft backgrounds, glow and the background grid.
const ALPHAS: Record<Theme, { soft: number; glow: number; grid: number }> = {
  dark: { soft: 0.14, glow: 0.35, grid: 0.055 },
  light: { soft: 0.1, glow: 0.18, grid: 0.06 },
}

/** The CSS custom properties that paint the accent on a theme. */
export function accentVars(choice: AccentChoice, theme: Theme): Record<string, string> {
  const { accent, strong } = accentColors(choice, theme)
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(accent.slice(i, i + 2), 16))
  const alpha = ALPHAS[theme]
  return {
    '--accent': accent,
    '--accent-strong': strong,
    '--accent-soft': `rgba(${r}, ${g}, ${b}, ${alpha.soft})`,
    '--glow': `rgba(${r}, ${g}, ${b}, ${alpha.glow})`,
    '--grid': `rgba(${r}, ${g}, ${b}, ${alpha.grid})`,
  }
}

// Saved as {"cor": "<name>", "personalizada": "#rrggbb" | null, "vars": {dark, light}}. The vars
// let index.html paint the accent before the app loads, without repeating the adjustment there.
const STORED: Record<AccentChoice['id'], string> = {
  violet: 'violeta',
  blue: 'azul',
  green: 'verde',
  orange: 'laranja',
  pink: 'rosa',
  custom: 'personalizada',
}
/** The saved color names; index.html repeats them, to paint only a saved color it knows. */
export const ACCENT_STORED_NAMES = Object.values(STORED)
const DEFAULT: AccentChoice = { id: 'violet', custom: null }

export function loadAccent(storage: Storage | null): AccentChoice {
  try {
    const data = JSON.parse(storage?.getItem(ACCENT_STORAGE_KEY) ?? 'null')
    if (typeof data !== 'object' || data === null) return DEFAULT
    const id = (Object.keys(STORED) as AccentChoice['id'][]).find((key) => STORED[key] === data.cor)
    const custom = typeof data.personalizada === 'string' ? parseHex(data.personalizada) : null
    if (!id || (id === 'custom' && !custom)) return DEFAULT
    return { id, custom }
  } catch {
    return DEFAULT
  }
}

export function saveAccent(choice: AccentChoice, storage: Storage | null): void {
  const vars = { dark: accentVars(choice, 'dark'), light: accentVars(choice, 'light') }
  try {
    storage?.setItem(ACCENT_STORAGE_KEY, JSON.stringify({ cor: STORED[choice.id], personalizada: choice.custom, vars }))
  } catch {
    // Storage blocked: the choice just isn't remembered.
  }
}

function toHsl(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = d / (1 - Math.abs(2 * l - 1))
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  h = (h * 60 + 360) % 360
  return { h, s, l }
}

function toHex(h: number, s: number, l: number) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return `#${[r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('')}`
}

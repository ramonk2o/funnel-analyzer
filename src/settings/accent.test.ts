import indexHtml from '../../index.html?raw'
import tokensCss from '../styles/tokens.css?raw'
import { contrastRatio } from '../theme/contrast'
import {
  ACCENT_IDS,
  ACCENT_STORAGE_KEY,
  ACCENT_STORED_NAMES,
  accentColors,
  customAccent,
  loadAccent,
  parseHex,
  PRESETS,
  saveAccent,
  THEME_BACKGROUNDS,
} from './accent'

const THEMES = ['dark', 'light'] as const

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial))
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  }
}

const brokenStorage: Storage = {
  length: 0,
  clear: () => {},
  key: () => null,
  getItem: () => {
    throw new Error('blocked')
  },
  removeItem: () => {},
  setItem: () => {
    throw new Error('blocked')
  },
}

function hsl(hex: string): { h: number; l: number } {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h = (h * 60 + 360) % 360
  }
  return { h, l: (max + min) / 2 }
}
const hueDistance = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b))

function minContrast(color: string, theme: 'dark' | 'light') {
  return Math.min(...THEME_BACKGROUNDS[theme].map((bg) => contrastRatio(color, bg)))
}

test('os fundos usados no ajuste são os mesmos de tokens.css', () => {
  for (const theme of THEMES) {
    const block = tokensCss.match(new RegExp(`\\[data-theme='${theme}'\\][^{]*\\{([^}]*)\\}`))![1]
    for (const name of ['bg', 'surface', 'surface-2']) {
      const value = block.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6});`))![1]
      expect(THEME_BACKGROUNDS[theme]).toContain(value.toLowerCase())
    }
  }
})

describe('cores prontas', () => {
  test('são Violeta, Azul, Verde, Laranja e Rosa, nessa ordem', () => {
    expect(ACCENT_IDS).toEqual(['violet', 'blue', 'green', 'orange', 'pink'])
  })

  test.each(ACCENT_IDS)('%s: destaque e destaque forte têm contraste de pelo menos 4,5:1 nos dois temas', (id) => {
    for (const theme of THEMES) {
      const { accent, strong } = PRESETS[id][theme]
      expect(minContrast(accent, theme), `${id} ${theme} destaque`).toBeGreaterThanOrEqual(4.5)
      expect(minContrast(strong, theme), `${id} ${theme} forte`).toBeGreaterThanOrEqual(4.5)
    }
  })

  test.each(ACCENT_IDS)('%s: no claro é mais escura que no escuro, no mesmo matiz', (id) => {
    const dark = hsl(PRESETS[id].dark.accent)
    const light = hsl(PRESETS[id].light.accent)
    expect(light.l).toBeLessThan(dark.l)
    expect(hueDistance(light.h, dark.h)).toBeLessThanOrEqual(15)
  })

  test('o Violeta continua com os tons de hoje', () => {
    expect(PRESETS.violet).toEqual({
      dark: { accent: '#a78bfa', strong: '#c4b5fd' },
      light: { accent: '#6d28d9', strong: '#5b21b6' },
    })
  })
})

describe('hexadecimal digitado', () => {
  test('aceita com e sem #, forma curta e maiúsculas', () => {
    expect(parseHex('#7c3aed')).toBe('#7c3aed')
    expect(parseHex('7c3aed')).toBe('#7c3aed')
    expect(parseHex('#7C3AED')).toBe('#7c3aed')
    expect(parseHex('#73e')).toBe('#7733ee')
    expect(parseHex('73E')).toBe('#7733ee')
    expect(parseHex(' #7c3aed ')).toBe('#7c3aed')
  })

  test('recusa o que não é um hexadecimal de 3 ou 6 dígitos', () => {
    for (const text of ['#7c3ae', '#1234', 'zzz', '#gggggg', '', '#', '##7c3aed', 'rgb(0,0,0)']) {
      expect(parseHex(text), text).toBeNull()
    }
  })
})

describe('ajuste da cor personalizada', () => {
  test('uma cor que já passa no contraste fica igual', () => {
    expect(customAccent('#a78bfa', 'dark')).toMatchObject({ accent: '#a78bfa', adjusted: false })
    expect(customAccent('#6d28d9', 'light')).toMatchObject({ accent: '#6d28d9', adjusted: false })
  })

  test.each([
    ['#000080', 'dark'],
    ['#ffff00', 'light'],
  ] as const)('%s no tema %s é ajustada: mesmo matiz e contraste de 4,5:1', (hex, theme) => {
    const result = customAccent(hex, theme)
    expect(result.adjusted).toBe(true)
    expect(result.accent).not.toBe(hex)
    expect(minContrast(result.accent, theme)).toBeGreaterThanOrEqual(4.5)
    expect(hueDistance(hsl(result.accent).h, hsl(hex).h)).toBeLessThanOrEqual(15)
  })

  test.each([
    ['#1a1a1a', 'dark'],
    ['#f0f0f0', 'light'],
  ] as const)('o cinza %s no tema %s é ajustado até passar no contraste', (hex, theme) => {
    const result = customAccent(hex, theme)
    expect(result.adjusted).toBe(true)
    expect(minContrast(result.accent, theme)).toBeGreaterThanOrEqual(4.5)
  })

  test.each(['#000080', '#ffff00', '#7c3aed', '#22c55e', '#000000', '#ffffff'])(
    '%s: o destaque forte passa no contraste, mais claro no escuro e mais escuro no claro',
    (hex) => {
      const dark = customAccent(hex, 'dark')
      const light = customAccent(hex, 'light')
      expect(minContrast(dark.strong, 'dark')).toBeGreaterThanOrEqual(4.5)
      expect(minContrast(light.strong, 'light')).toBeGreaterThanOrEqual(4.5)
      expect(hsl(dark.strong).l).toBeGreaterThanOrEqual(hsl(dark.accent).l)
      expect(hsl(light.strong).l).toBeLessThanOrEqual(hsl(light.accent).l)
    },
  )

  test('a cor em uso é a pronta, ou a personalizada ajustada para o tema', () => {
    expect(accentColors({ id: 'blue', custom: null }, 'light')).toMatchObject({ accent: PRESETS.blue.light.accent, adjusted: false })
    expect(accentColors({ id: 'custom', custom: '#ffff00' }, 'light')).toEqual(customAccent('#ffff00', 'light'))
  })
})

describe('escolha salva', () => {
  test('sem nada salvo, ou com valor inválido, vale o Violeta', () => {
    expect(loadAccent(memoryStorage())).toEqual({ id: 'violet', custom: null })
    for (const raw of ['azul', '{quebrado', '{"cor":"roxo"}', '{"cor":"personalizada","personalizada":"zzz"}', '[]', 'null']) {
      expect(loadAccent(memoryStorage({ [ACCENT_STORAGE_KEY]: raw })), raw).toEqual({ id: 'violet', custom: null })
    }
  })

  test('uma cor pronta e uma personalizada são gravadas e lidas de volta, na chave do app', () => {
    expect(ACCENT_STORAGE_KEY).toBe('analisador-de-funil:destaque')
    const storage = memoryStorage()
    saveAccent({ id: 'green', custom: null }, storage)
    expect(loadAccent(storage)).toEqual({ id: 'green', custom: null })
    saveAccent({ id: 'custom', custom: '#123456' }, storage)
    expect(loadAccent(storage)).toEqual({ id: 'custom', custom: '#123456' })
    // A ready color keeps the last custom one, to come back to it.
    saveAccent({ id: 'pink', custom: '#123456' }, storage)
    expect(loadAccent(storage)).toEqual({ id: 'pink', custom: '#123456' })
  })

  test('com o armazenamento bloqueado, vale o Violeta e salvar não dá erro', () => {
    expect(loadAccent(brokenStorage)).toEqual({ id: 'violet', custom: null })
    expect(loadAccent(null)).toEqual({ id: 'violet', custom: null })
    expect(() => saveAccent({ id: 'blue', custom: null }, brokenStorage)).not.toThrow()
    expect(() => saveAccent({ id: 'blue', custom: null }, null)).not.toThrow()
  })

  test('o script anti-piscada do index.html usa a mesma chave e os mesmos nomes de cor', () => {
    expect(indexHtml).toContain(`'${ACCENT_STORAGE_KEY}'`)
    for (const name of ACCENT_STORED_NAMES) expect(indexHtml).toContain(`'${name}'`)
  })
})

import tokensCss from '../styles/tokens.css?raw'
import { contrastRatio } from './contrast'

function tokensFor(theme: 'dark' | 'light'): Record<string, string> {
  const block = tokensCss.match(new RegExp(`\\[data-theme='${theme}'\\][^{]*\\{([^}]*)\\}`))
  if (!block) throw new Error(`sem bloco de tokens para ${theme}`)
  const tokens: Record<string, string> = {}
  for (const [, name, value] of block[1].matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    tokens[name] = value.trim()
  }
  return tokens
}

test('contraste de referência: preto sobre branco é 21:1', () => {
  expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
  expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
})

test.each(['dark', 'light'] as const)(
  'tema %s: toda cor de texto tem contraste de pelo menos 4,5:1 com todo fundo',
  (theme) => {
    const t = tokensFor(theme)
    for (const fg of ['accent', 'accent-strong', 'text', 'text-muted']) {
      for (const bg of ['bg', 'surface', 'surface-2']) {
        expect(t[fg], `--${fg}`).toMatch(/^#[0-9a-fA-F]{6}$/)
        expect(t[bg], `--${bg}`).toMatch(/^#[0-9a-fA-F]{6}$/)
        expect(contrastRatio(t[fg], t[bg]), `--${fg} sobre --${bg}`).toBeGreaterThanOrEqual(4.5)
      }
    }
  },
)

test('tema claro: o destaque é um violeta mais escuro que o do tema escuro', () => {
  const light = hsl(tokensFor('light').accent)
  expect(light.h).toBeGreaterThanOrEqual(250)
  expect(light.h).toBeLessThanOrEqual(290)
  expect(light.l).toBeLessThan(hsl(tokensFor('dark').accent).l)
})

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

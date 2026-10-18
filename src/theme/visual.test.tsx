import { render, screen, within } from '@testing-library/react'
import indexHtml from '../../index.html?raw'
import baseCss from '../styles/base.css?raw'
import tokensCss from '../styles/tokens.css?raw'
import App from '../App'
import { texts } from '../texts'

function darkTokens(): Record<string, string> {
  const block = tokensCss.match(/\[data-theme='dark'\][^{]*\{([^}]*)\}/)!
  return Object.fromEntries([...block[1].matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, n, v]) => [n, v.trim()]))
}

test('tema escuro: o destaque é #A78BFA', () => {
  expect(darkTokens().accent.toLowerCase()).toBe('#a78bfa')
})

test('fontes: Space Grotesk nos textos e JetBrains Mono nos números, com fontes do sistema como reserva', () => {
  expect(tokensCss).toMatch(/--font-sans:\s*'Space Grotesk',[^;]*sans-serif;/)
  expect(tokensCss).toMatch(/--font-mono:\s*'JetBrains Mono',[^;]*monospace;/)
  expect(indexHtml).toMatch(/fonts\.googleapis\.com\/css2\?[^"]*JetBrains\+Mono[^"]*Space\+Grotesk/)
  expect(baseCss).toMatch(/body\s*\{[^}]*font-family:\s*var\(--font-sans\)/)
  expect(baseCss).toMatch(/\.num\s*\{[^}]*font-family:\s*var\(--font-mono\)/)
})

test('os números do funil de exemplo usam a fonte monoespaçada', () => {
  render(<App />)
  const funnel = screen.getByRole('list', { name: texts.funnel.sampleLabel })
  for (const stage of texts.funnel.sampleStages) {
    expect(within(funnel).getByText(stage.volume)).toHaveClass('num')
    if (stage.conversion) expect(within(funnel).getByText(stage.conversion)).toHaveClass('num')
  }
})

test('existem estilos de base para botão, campo e cartão', () => {
  for (const cls of ['btn', 'input', 'card']) {
    expect(baseCss).toMatch(new RegExp(`\\.${cls}\\s*\\{`))
  }
})

test('o botão de tema fica no cabeçalho, junto do nome', () => {
  render(<App />)
  const header = screen.getByRole('banner')
  expect(within(header).getByRole('heading', { level: 1, name: texts.appName })).toBeInTheDocument()
  expect(within(header).getByRole('button', { name: texts.theme.switchToLight })).toBeInTheDocument()
})

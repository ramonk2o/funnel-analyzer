import { blankFunnelName, copyName, importedName } from './names'

test('funil novo em branco: "Funil N", com o próximo número livre', () => {
  expect(blankFunnelName(['Meu funil'])).toBe('Funil 1')
  expect(blankFunnelName(['Meu funil', 'Funil 1'])).toBe('Funil 2')
  expect(blankFunnelName(['Funil 2', 'Funil 1', 'Funil 4'])).toBe('Funil 3')
})

test('cópia: "(cópia)", depois "(cópia 2)" e assim por diante', () => {
  expect(copyName('Black Friday', ['Black Friday'])).toBe('Black Friday (cópia)')
  expect(copyName('Black Friday', ['Black Friday', 'Black Friday (cópia)'])).toBe('Black Friday (cópia 2)')
  expect(
    copyName('Black Friday', ['Black Friday', 'Black Friday (cópia)', 'Black Friday (cópia 2)']),
  ).toBe('Black Friday (cópia 3)')
})

test('importado: mantém o nome; se já existir, ganha "(2)", "(3)"…', () => {
  expect(importedName('Natal', ['Meu funil'])).toBe('Natal')
  expect(importedName('Natal', ['Natal'])).toBe('Natal (2)')
  expect(importedName('Natal', ['Natal', 'Natal (2)'])).toBe('Natal (3)')
})

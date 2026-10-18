import { formatConversion, formatMoney, formatRoas, formatRoi, formatVolume, parseDecimal } from './numbers'

test('lê números com vírgula decimal', () => {
  expect(parseDecimal('1,50')).toBe(1.5)
  expect(parseDecimal('2000')).toBe(2000)
  expect(parseDecimal(' 12 ')).toBe(12)
  expect(parseDecimal('0')).toBe(0)
})

test('aceita vírgula sem dígitos de um dos lados', () => {
  expect(parseDecimal(',5')).toBe(0.5)
  expect(parseDecimal('1,')).toBe(1)
})

test('não aceita ponto, separador de milhar nem texto', () => {
  for (const text of ['2.000', '1.5', '1.000,50', 'abc', '1,2,3', '12a', ',', '']) {
    expect(parseDecimal(text)).toBeNull()
  }
})

test('volumes aparecem inteiros, com separador de milhar', () => {
  expect(formatVolume(100000)).toBe('100.000')
  expect(formatVolume(44.6)).toBe('45')
  expect(formatVolume(0)).toBe('0')
})

test('dinheiro aparece em R$ com 2 casas', () => {
  expect(formatMoney(2000)).toBe('R$ 2.000,00')
  expect(formatMoney(44.444)).toBe('R$ 44,44')
  expect(formatMoney(0.8)).toBe('R$ 0,80')
})

test('ROAS aparece como multiplicador e ROI em porcentagem com 1 casa', () => {
  expect(formatRoas(3.2)).toBe('3,20x')
  expect(formatRoi(0.45)).toBe('45,0%')
  expect(formatRoi(-0.125)).toBe('-12,5%')
})

test('a conversão aparece como foi digitada', () => {
  expect(formatConversion(2.5)).toBe('2,5%')
  expect(formatConversion(12)).toBe('12%')
})

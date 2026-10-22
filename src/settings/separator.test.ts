import { formatConversion, formatMoney, formatRoas, formatRoi, formatVolume } from '../funnel/numbers'
import { loadSeparator, parseTyped, saveSeparator, SEPARATOR_STORAGE_KEY, swapSeparators } from './separator'

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

describe('leitura do que foi digitado', () => {
  test('com vírgula, igual a hoje', () => {
    expect(parseTyped('1,50', 'comma')).toBe(1.5)
    expect(parseTyped(',5', 'comma')).toBe(0.5)
    expect(parseTyped('1,', 'comma')).toBe(1)
    expect(parseTyped(' 2000 ', 'comma')).toBe(2000)
    for (const text of ['2.000', '1.5', '1.000,50', 'abc', ',', '']) expect(parseTyped(text, 'comma')).toBeNull()
  })

  test('com ponto, o ponto é o decimal', () => {
    expect(parseTyped('1.50', 'dot')).toBe(1.5)
    expect(parseTyped('.5', 'dot')).toBe(0.5)
    expect(parseTyped('1.', 'dot')).toBe(1)
    expect(parseTyped(' 2.5 ', 'dot')).toBe(2.5)
    expect(parseTyped('2000', 'dot')).toBe(2000)
  })

  test('com ponto, qualquer vírgula deixa o campo inválido', () => {
    for (const text of ['1,5', '2,000', '1.234,5', '1,234.5', '.', 'abc', '1.2.3', '']) {
      expect(parseTyped(text, 'dot')).toBeNull()
    }
  })
})

describe('números na tela', () => {
  test('com ponto, o decimal é ponto e o milhar é vírgula', () => {
    expect(formatMoney(2000, 'dot')).toBe('R$ 2,000.00')
    expect(formatMoney(0.8, 'dot')).toBe('R$ 0.80')
    expect(formatVolume(2000, 'dot')).toBe('2,000')
    expect(formatVolume(100000, 'dot')).toBe('100,000')
    expect(formatRoas(3.2, 'dot')).toBe('3.20x')
    expect(formatRoi(0.45, 'dot')).toBe('45.0%')
    expect(formatRoi(-0.125, 'dot')).toBe('-12.5%')
    expect(formatConversion(2.5, 'dot')).toBe('2.5%')
  })

  test('com vírgula, igual a hoje', () => {
    expect(formatMoney(2000, 'comma')).toBe('R$ 2.000,00')
    expect(formatVolume(2000, 'comma')).toBe('2.000')
    expect(formatRoas(3.2, 'comma')).toBe('3,20x')
    expect(formatRoi(-0.125, 'comma')).toBe('-12,5%')
    expect(formatConversion(2.5, 'comma')).toBe('2,5%')
  })
})

test('converter troca vírgula e ponto entre si; sem nenhum dos dois, o texto fica igual', () => {
  expect(swapSeparators('1,50')).toBe('1.50')
  expect(swapSeparators('1.50')).toBe('1,50')
  expect(swapSeparators('1.234,5')).toBe('1,234.5')
  expect(swapSeparators('2000')).toBe('2000')
  expect(swapSeparators('abc')).toBe('abc')
  expect(swapSeparators('')).toBe('')
})

describe('escolha salva', () => {
  test('sem nada salvo, ou com valor inválido, vale a vírgula', () => {
    expect(loadSeparator(memoryStorage())).toBe('comma')
    expect(loadSeparator(memoryStorage({ [SEPARATOR_STORAGE_KEY]: 'espaço' }))).toBe('comma')
  })

  test('a escolha é gravada e lida de volta na chave do app', () => {
    expect(SEPARATOR_STORAGE_KEY).toBe('analisador-de-funil:separador')
    const storage = memoryStorage()
    saveSeparator('dot', storage)
    expect(storage.getItem(SEPARATOR_STORAGE_KEY)).toBe('ponto')
    expect(loadSeparator(storage)).toBe('dot')
    saveSeparator('comma', storage)
    expect(storage.getItem(SEPARATOR_STORAGE_KEY)).toBe('virgula')
    expect(loadSeparator(storage)).toBe('comma')
  })

  test('com o armazenamento bloqueado, vale a vírgula e salvar não dá erro', () => {
    expect(loadSeparator(brokenStorage)).toBe('comma')
    expect(loadSeparator(null)).toBe('comma')
    expect(() => saveSeparator('dot', brokenStorage)).not.toThrow()
    expect(() => saveSeparator('dot', null)).not.toThrow()
  })
})

import indexHtml from '../../index.html?raw'
import { loadTheme, saveTheme, THEME_STORAGE_KEY } from './theme'

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

test('sem nada salvo, o tema é escuro', () => {
  expect(loadTheme(memoryStorage())).toBe('dark')
})

test('sem armazenamento disponível, o tema é escuro', () => {
  expect(loadTheme(null)).toBe('dark')
  expect(loadTheme(brokenStorage)).toBe('dark')
})

test('um valor salvo inválido é ignorado', () => {
  expect(loadTheme(memoryStorage({ [THEME_STORAGE_KEY]: 'purple' }))).toBe('dark')
})

test('o tema salvo é lido de volta', () => {
  const storage = memoryStorage()
  saveTheme('light', storage)
  expect(loadTheme(storage)).toBe('light')
  saveTheme('dark', storage)
  expect(loadTheme(storage)).toBe('dark')
})

test('salvar sem armazenamento não lança erro', () => {
  expect(() => saveTheme('light', brokenStorage)).not.toThrow()
  expect(() => saveTheme('light', null)).not.toThrow()
})

test('o script anti-piscada do index.html usa a mesma chave', () => {
  expect(indexHtml).toContain(`'${THEME_STORAGE_KEY}'`)
})

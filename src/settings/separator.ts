import { createContext, useContext } from 'react'
import { parseDecimal, shown, type Separator } from '../funnel/numbers'
import { texts } from '../texts'

export { shown, swapSeparators, type Separator } from '../funnel/numbers'

export const SEPARATOR_STORAGE_KEY = texts.settings.storageKey

const STORED: Record<Separator, string> = { comma: 'virgula', dot: 'ponto' }

/** A number as typed with the chosen separator, or null if it isn't a valid one. */
export const parseTyped = (text: string, separator: Separator) => parseDecimal(shown(text, separator))

export function loadSeparator(storage: Storage | null): Separator {
  try {
    return storage?.getItem(SEPARATOR_STORAGE_KEY) === STORED.dot ? 'dot' : 'comma'
  } catch {
    return 'comma'
  }
}

export function saveSeparator(separator: Separator, storage: Storage | null): void {
  try {
    storage?.setItem(SEPARATOR_STORAGE_KEY, STORED[separator])
  } catch {
    // Storage blocked: the choice just isn't remembered.
  }
}

export const SeparatorContext = createContext<Separator>('comma')
export const useSeparator = () => useContext(SeparatorContext)

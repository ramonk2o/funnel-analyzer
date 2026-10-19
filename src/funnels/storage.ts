import type { FunnelForm } from '../funnel/form'
import { texts } from '../texts'
import { isObject, parseForm } from './parse'

const KEY = texts.funnels.storageKey

export interface SavedFunnel {
  id: string
  name: string
  form: FunnelForm
}

export interface Library {
  activeId: string
  /** In creation order; never empty. */
  funnels: SavedFunnel[]
}

let nextId = 0
export const newFunnelId = () => `funnel-${++nextId}`

/**
 * The funnels saved in the browser, or null when there are none to read (first visit, broken
 * value, blocked storage). Funnels that can't be read are left out. Each gets a new id.
 */
export function loadLibrary(storage: Storage | null): Library | null {
  let data: unknown
  try {
    const raw = storage?.getItem(KEY)
    if (!raw) return null
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isObject(data) || !Array.isArray(data.funnels)) return null

  let activeId: string | undefined
  const funnels: SavedFunnel[] = []
  for (const saved of data.funnels) {
    const form = isObject(saved) ? parseForm(saved.form) : null
    if (!form || typeof saved.name !== 'string') continue
    const funnel = { id: newFunnelId(), name: saved.name, form }
    if (saved.id === data.activeId) activeId = funnel.id
    funnels.push(funnel)
  }
  if (funnels.length === 0) return null
  // The last active funnel is gone: the first one opens.
  return { activeId: activeId ?? funnels[0].id, funnels }
}

/** Saves the funnels; false when they couldn't be saved (blocked storage, no space left). */
export function saveLibrary(library: Library, storage: Storage | null): boolean {
  if (!storage) return false
  try {
    storage.setItem(KEY, JSON.stringify(library))
    return true
  } catch {
    return false
  }
}

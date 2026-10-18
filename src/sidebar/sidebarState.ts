import { texts } from '../texts'

const KEY = texts.sidebar.storageKey

// On narrow screens (same breakpoint as the CSS) the sidebar covers the funnel.
export const isNarrowScreen = () => window.matchMedia?.('(max-width: 800px)').matches ?? false

/** Open unless "closed" was saved; anything else (nothing, invalid, blocked storage) means open. */
export function loadSidebarOpen(storage: Storage | null): boolean {
  try {
    return storage?.getItem(KEY) !== 'fechada'
  } catch {
    return true
  }
}

export function saveSidebarOpen(open: boolean, storage: Storage | null): void {
  try {
    storage?.setItem(KEY, open ? 'aberta' : 'fechada')
  } catch {
    // Storage blocked: the choice just isn't remembered.
  }
}

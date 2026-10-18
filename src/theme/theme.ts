export type Theme = 'dark' | 'light'

// Also read by the inline script in index.html, which applies the theme before React loads.
export const THEME_STORAGE_KEY = 'simulador-de-funil:tema'

export function browserStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function loadTheme(storage: Storage | null): Theme {
  try {
    return storage?.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function saveTheme(theme: Theme, storage: Storage | null): void {
  try {
    storage?.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Storage blocked: the choice just isn't remembered.
  }
}

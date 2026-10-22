import { useEffect, useState } from 'react'
import { browserStorage, loadTheme, saveTheme, type Theme } from './theme'

export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => loadTheme(browserStorage()))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const change = (next: Theme) => {
    setTheme(next)
    saveTheme(next, browserStorage())
  }

  return [theme, change]
}

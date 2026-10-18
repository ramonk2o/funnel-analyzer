import { useEffect, useState } from 'react'
import { browserStorage, loadTheme, saveTheme, type Theme } from './theme'

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => loadTheme(browserStorage()))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    saveTheme(next, browserStorage())
  }

  return [theme, toggle]
}

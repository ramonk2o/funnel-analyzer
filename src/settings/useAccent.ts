import { useEffect, useState } from 'react'
import { browserStorage, type Theme } from '../theme/theme'
import { accentVars, loadAccent, saveAccent, type AccentChoice } from './accent'

/** The chosen accent color, painted on the page for the current theme and remembered in the browser. */
export function useAccent(theme: Theme): [AccentChoice, (choice: AccentChoice) => void] {
  const [choice, setChoice] = useState<AccentChoice>(() => loadAccent(browserStorage()))

  useEffect(() => {
    const { style } = document.documentElement
    for (const [name, value] of Object.entries(accentVars(choice, theme))) style.setProperty(name, value)
  }, [choice, theme])

  const change = (next: AccentChoice) => {
    setChoice(next)
    saveAccent(next, browserStorage())
  }
  return [choice, change]
}

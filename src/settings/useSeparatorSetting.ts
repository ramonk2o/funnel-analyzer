import { useState } from 'react'
import { browserStorage } from '../theme/theme'
import { loadSeparator, saveSeparator, type Separator } from './separator'

/** The chosen decimal separator, remembered in the browser when it can be. */
export function useSeparatorSetting(): [Separator, (separator: Separator) => void] {
  const [separator, setSeparator] = useState<Separator>(() => loadSeparator(browserStorage()))
  const change = (next: Separator) => {
    setSeparator(next)
    saveSeparator(next, browserStorage())
  }
  return [separator, change]
}

import { useEffect, useRef, useState } from 'react'
import { browserStorage } from '../theme/theme'
import { isNarrowScreen, loadSidebarOpen, saveSidebarOpen } from './sidebarState'

/**
 * Whether the editing sidebar is open, remembered between visits (narrow screens always start
 * closed and don't change what is remembered). `focusOnOpen` is the id of the element that gets focus when opened by the button.
 */
export function useSidebar(focusOnOpen: string) {
  const [open, setOpenState] = useState(() => !isNarrowScreen() && loadSidebarOpen(browserStorage()))
  const buttonRef = useRef<HTMLButtonElement>(null)
  const focusPending = useRef(false)

  // Runs once the sidebar is no longer inert, so its fields can take focus.
  useEffect(() => {
    if (open && focusPending.current) document.getElementById(focusOnOpen)?.focus()
    focusPending.current = false
  }, [open, focusOnOpen])

  function setOpen(next: boolean) {
    setOpenState(next)
    // Narrow screens always start closed, so what happens there isn't remembered.
    if (!isNarrowScreen()) saveSidebarOpen(next, browserStorage())
  }

  function close() {
    // Focus leaves the sidebar before it turns inert, back to the button that opens it.
    buttonRef.current?.focus()
    setOpen(false)
  }

  function toggle() {
    if (open) return close()
    focusPending.current = true
    setOpen(true)
  }

  return { open, buttonRef, toggle, close, show: () => setOpen(true) }
}

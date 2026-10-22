import { useEffect, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { isNarrowScreen } from './sidebarState'

interface Props {
  open: boolean
  onClose: () => void
  /** The header button that opens and closes it: on narrow screens Tab cycles through it and the sidebar. */
  buttonRef: RefObject<HTMLButtonElement | null>
  children: ReactNode
}

// Closed, the sidebar slides out and nothing in it can be reached. On narrow screens it covers
// the funnel below the header, with a backdrop that closes it, and Tab stays within the header
// button and the sidebar while it's open.
export function Sidebar({ open, onClose, buttonRef, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function trapTab(e: globalThis.KeyboardEvent) {
      if (!isNarrowScreen() || !buttonRef.current || !ref.current) return
      // Keys pressed elsewhere (a modal over the page) aren't the sidebar's; with nothing focused, Tab enters the cycle.
      const target = e.target as Node
      if (target !== document.body && target !== buttonRef.current && !ref.current.contains(target)) return
      // Esc inside the sidebar is handled below; the header button is part of the cycle too.
      if (e.key === 'Escape' && document.activeElement === buttonRef.current) return onClose()
      if (e.key !== 'Tab') return
      const items = [buttonRef.current, ...focusables(ref.current)]
      const at = items.indexOf(document.activeElement as HTMLElement)
      const next = at === -1 ? 0 : (at + (e.shiftKey ? -1 : 1) + items.length) % items.length
      e.preventDefault()
      items[next].focus()
    }
    document.addEventListener('keydown', trapTab)
    return () => document.removeEventListener('keydown', trapTab)
  }, [open, buttonRef, onClose])

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <>
      <div ref={ref} className="sidebar" inert={!open} aria-hidden={!open || undefined} onKeyDown={onKeyDown}>
        {children}
      </div>
      {open && <div className="sidebar-backdrop" aria-hidden="true" onClick={onClose} />}
    </>
  )
}

function focusables(root: HTMLElement) {
  const selector = 'button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'
  return [...root.querySelectorAll<HTMLElement>(selector)].filter((el) => !el.closest('[inert]'))
}

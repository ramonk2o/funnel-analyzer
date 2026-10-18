import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  id: string
  open: boolean
  children: ReactNode
}

// Animates the height when opening and closing. The content is only in the page while open
// or closing; while closing it is inert, so it can't be reached by keyboard or screen readers.
export function Collapse({ id, open, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(open)
  const [expanded, setExpanded] = useState(open)
  // Clipped while moving or closed; once fully open, focus rings may spill over the edges.
  const [settled, setSettled] = useState(open)

  if (open && !rendered) setRendered(true)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || open === expanded) return
    if (open) {
      // Start from the collapsed height so the browser animates the change: it has to be laid out
      // collapsed before expanding, which is why this state is set in a layout effect.
      void el.offsetHeight
      // oxlint-disable-next-line react/set-state-in-effect
      setExpanded(true)
      setSettled(!hasTransition(el))
    } else if (hasTransition(el)) {
      setExpanded(false)
      setSettled(false)
    } else {
      setExpanded(false)
      setRendered(false)
    }
  }, [open, rendered, expanded])

  if (!rendered) return null

  return (
    <div
      ref={ref}
      id={id}
      className={`collapse${expanded ? ' collapse-open' : ''}${settled ? ' collapse-settled' : ''}`}
      onTransitionEnd={(e) => {
        if (e.target !== e.currentTarget) return
        if (open) setSettled(true)
        else setRendered(false)
      }}
    >
      <div className="collapse-inner" inert={!open}>
        {children}
      </div>
    </div>
  )
}

// No transition (reduced motion, or no CSS as in tests): there is nothing to wait for.
function hasTransition(el: HTMLElement) {
  const duration = getComputedStyle(el).transitionDuration
  return duration.split(',').some((d) => parseFloat(d) > 0)
}

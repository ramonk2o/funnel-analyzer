import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import { previewOrder } from './dragOrder'

export interface StageDrag {
  id: string
  /** The list order as it would be if the stage were dropped now. */
  order: string[]
  /** Where the copy that follows the pointer is drawn (viewport coordinates). */
  ghost: { top: number; left: number; width: number }
}

const THRESHOLD = 5 // px the pointer must move before a press on the handle becomes a drag
const EDGE = 40 // px from the scroller's edge where auto-scroll starts
const SPEED = 8 // px per frame

/**
 * Dragging stages by their handle, with mouse or touch (pointer events). The drag starts once the
 * pointer has moved a few pixels, so a plain click does nothing. While dragging, the list shows the
 * order it will have on drop. Dropping anywhere in the list's scrolling container (the sidebar)
 * calls `onDrop`; Esc or dropping outside it cancels. Near its top or bottom edge it scrolls on its own.
 */
export function useStageDrag(
  listRef: RefObject<HTMLElement | null>,
  ids: string[],
  onDrop: (id: string, to: number) => void,
) {
  const [drag, setDrag] = useState<StageDrag | null>(null)
  const pointerY = useRef(0)
  const order = useRef<string[]>([])
  const grabOffset = useRef(0)
  const dropRef = useRef(onDrop)
  useEffect(() => {
    dropRef.current = onDrop
  })

  function start(e: ReactPointerEvent<HTMLElement>, id: string) {
    if (e.button !== 0) return
    e.preventDefault()
    const stage = e.currentTarget.closest('[data-stage-id]')!
    const { clientX: x0, clientY: y0 } = e

    function move(ev: PointerEvent) {
      if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < THRESHOLD) return
      stop()
      const box = stage.getBoundingClientRect()
      pointerY.current = ev.clientY
      order.current = ids
      grabOffset.current = y0 - box.top
      setDrag({ id, order: ids, ghost: { top: ev.clientY - grabOffset.current, left: box.left, width: box.width } })
    }
    function stop() {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
  }

  const dragId = drag?.id
  useEffect(() => {
    const list = listRef.current
    if (!dragId || !list) return
    const scroller = scrollParent(list)

    function reorder() {
      const others = [...list!.querySelectorAll<HTMLElement>(':scope > [data-stage-id]')].filter(
        (el) => el.dataset.stageId !== dragId,
      )
      const midpoints = others.map((el) => {
        const r = el.getBoundingClientRect()
        return r.top + r.height / 2
      })
      order.current = previewOrder(order.current, dragId!, pointerY.current, midpoints)
      const top = pointerY.current - grabOffset.current
      setDrag((d) => d && { ...d, order: order.current, ghost: { ...d.ghost, top } })
    }

    let frame = requestAnimationFrame(function autoScroll() {
      if (scroller) {
        const r = scroller.getBoundingClientRect()
        const y = pointerY.current
        const delta = y < r.top + EDGE ? -SPEED : y > r.bottom - EDGE ? SPEED : 0
        const before = scroller.scrollTop
        if (delta) scroller.scrollTop += delta
        if (scroller.scrollTop !== before) reorder()
      }
      frame = requestAnimationFrame(autoScroll)
    })

    function move(e: PointerEvent) {
      pointerY.current = e.clientY
      reorder()
    }
    function end(e: PointerEvent) {
      const r = (scroller ?? list!).getBoundingClientRect()
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
      if (e.type === 'pointerup' && inside) dropRef.current(dragId!, order.current.indexOf(dragId!))
      setDrag(null)
    }
    // Captured on the window so Esc only cancels the drag (it doesn't also close the sidebar).
    function key(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      setDrag(null)
    }

    // The stages just collapsed: place the dragged one where the pointer is now.
    reorder()
    document.documentElement.classList.add('dragging-stage')
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    window.addEventListener('keydown', key, true)
    return () => {
      cancelAnimationFrame(frame)
      document.documentElement.classList.remove('dragging-stage')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      window.removeEventListener('keydown', key, true)
    }
  }, [dragId, listRef])

  return { drag, start }
}

function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p; p = p.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(p).overflowY)) return p
  }
  return null
}

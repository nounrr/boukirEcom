"use client"

import { useEffect, type RefObject } from "react"

/**
 * Lets a horizontal scroll strip (overflow-x: auto) be dragged with the mouse, like a finger does
 * on a phone (touch keeps the browser's own scrolling). A drag does not click the item it started on.
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let drag: { id: number; x: number; scroll: number; moved: boolean } | null = null
    let suppressClick = false

    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return
      if (el.scrollWidth <= el.clientWidth) return
      suppressClick = false
      drag = { id: event.pointerId, x: event.clientX, scroll: el.scrollLeft, moved: false }
    }
    const onMove = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return
      const dx = event.clientX - drag.x
      if (!drag.moved && Math.abs(dx) > 6) {
        drag.moved = true
        el.setPointerCapture?.(event.pointerId)
        el.dataset.dragging = "true"
      }
      if (drag.moved) el.scrollLeft = drag.scroll - dx
    }
    const onUp = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return
      suppressClick = drag.moved
      // Some browsers send no click after a drag: forget it so the next real click works.
      if (suppressClick) window.setTimeout(() => { suppressClick = false }, 80)
      drag = null
      delete el.dataset.dragging
      if (el.hasPointerCapture?.(event.pointerId)) el.releasePointerCapture(event.pointerId)
    }
    const onClick = (event: MouseEvent) => {
      if (!suppressClick) return
      suppressClick = false
      event.preventDefault()
      event.stopPropagation()
    }
    const onDragStart = (event: DragEvent) => event.preventDefault()

    el.addEventListener("pointerdown", onDown)
    el.addEventListener("pointermove", onMove)
    el.addEventListener("pointerup", onUp)
    el.addEventListener("pointercancel", onUp)
    el.addEventListener("click", onClick, true)
    el.addEventListener("dragstart", onDragStart)
    return () => {
      el.removeEventListener("pointerdown", onDown)
      el.removeEventListener("pointermove", onMove)
      el.removeEventListener("pointerup", onUp)
      el.removeEventListener("pointercancel", onUp)
      el.removeEventListener("click", onClick, true)
      el.removeEventListener("dragstart", onDragStart)
    }
  }, [ref])
}

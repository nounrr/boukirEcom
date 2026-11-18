"use client"

import { useEffect, useRef, type ReactNode } from "react"

import { cn } from "@/lib/utils"

/** Movement past which a press counts as a drag (and the link under it does not open). */
const DRAG_THRESHOLD = 6

/**
 * A row that moves continuously, with no stop between items, and that can be dragged with a
 * finger or the mouse; it moves on by itself again when released. The items are drawn twice
 * and the position wraps on one copy's width, so the loop has no seam.
 *
 * - `reverse`: false moves right to left, true moves left to right (on screen, whatever the language).
 * - `paused`: no movement by itself (the pause button of the section); dragging still works.
 * - `secondsPerItem`: speed; one loop lasts `items × secondsPerItem` seconds.
 * - Reduced motion: no movement by itself, dragging still works.
 * - Off screen: the animation loop sleeps.
 */
export function MarqueeRow({
  items,
  reverse = false,
  paused = false,
  secondsPerItem = 5,
  className,
  itemClassName,
  label,
  itemDir,
}: {
  items: ReactNode[]
  reverse?: boolean
  paused?: boolean
  secondsPerItem?: number
  className?: string
  itemClassName?: string
  label?: string
  /** language direction of the cards (the track itself is always left to right) */
  itemDir?: "ltr" | "rtl"
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(paused)
  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  const count = items.length

  useEffect(() => {
    const row = rowRef.current
    const track = trackRef.current
    const copy = copyRef.current
    if (!row || !track || !copy || count === 0) return

    let x = 0
    let width = copy.offsetWidth
    let visible = true
    let frame = 0
    let last = 0
    let drag: { id: number; startX: number; startOffset: number; moved: boolean } | null = null
    let suppressClick = false
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")

    const wrap = () => {
      if (width <= 0) return
      x = (((x % width) + width) % width) - width // always in [-width, 0)
    }
    const paint = () => {
      track.style.transform = `translate3d(${x}px,0,0)`
    }

    const tick = (now: number) => {
      frame = 0
      const dt = last ? Math.min(64, now - last) : 0
      last = now
      if (!drag && !pausedRef.current && !reduce.matches && width > 0) {
        const speed = width / Math.max(20, count * secondsPerItem) / 1000 // px per ms
        x += (reverse ? 1 : -1) * speed * dt
        wrap()
        paint()
      }
      if (visible) frame = requestAnimationFrame(tick)
    }
    const start = () => {
      if (!frame) {
        last = 0
        frame = requestAnimationFrame(tick)
      }
    }

    // The reverse row starts half a loop in, so the two directions do not line up.
    if (reverse) x = -width / 2
    wrap()
    paint()
    start()

    const resize = new ResizeObserver(() => {
      width = copy.offsetWidth
      wrap()
      paint()
    })
    resize.observe(copy)

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
    })
    io.observe(row)

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return
      suppressClick = false
      drag = { id: event.pointerId, startX: event.clientX, startOffset: x, moved: false }
    }
    const onMove = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return
      const dx = event.clientX - drag.startX
      if (!drag.moved && Math.abs(dx) > DRAG_THRESHOLD) {
        drag.moved = true
        row.setPointerCapture?.(event.pointerId)
        row.dataset.dragging = "true"
      }
      if (drag.moved) {
        x = drag.startOffset + dx
        wrap()
        paint()
      }
    }
    const onUp = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return
      suppressClick = drag.moved
      // Some browsers send no click after a drag: forget it so the next real click works.
      if (suppressClick) window.setTimeout(() => { suppressClick = false }, 80)
      drag = null
      delete row.dataset.dragging
      if (row.hasPointerCapture?.(event.pointerId)) row.releasePointerCapture(event.pointerId)
      last = 0
    }
    // A drag must not open the card it started on.
    const onClick = (event: MouseEvent) => {
      if (!suppressClick) return
      suppressClick = false
      event.preventDefault()
      event.stopPropagation()
    }
    // Links and images are not dragged out by the browser.
    const onDragStart = (event: DragEvent) => event.preventDefault()

    row.addEventListener("pointerdown", onDown)
    row.addEventListener("pointermove", onMove)
    row.addEventListener("pointerup", onUp)
    row.addEventListener("pointercancel", onUp)
    row.addEventListener("click", onClick, true)
    row.addEventListener("dragstart", onDragStart)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      resize.disconnect()
      io.disconnect()
      row.removeEventListener("pointerdown", onDown)
      row.removeEventListener("pointermove", onMove)
      row.removeEventListener("pointerup", onUp)
      row.removeEventListener("pointercancel", onUp)
      row.removeEventListener("click", onClick, true)
      row.removeEventListener("dragstart", onDragStart)
    }
  }, [count, reverse, secondsPerItem])

  if (count === 0) return null

  return (
    // dir="ltr" on the row: the slide is a screen direction (and an RTL page would pin the track
    // to the right edge); each card gets back the page language through `itemDir`.
    <div
      ref={rowRef}
      dir="ltr"
      role={label ? "group" : undefined}
      aria-label={label}
      className={cn(
        // pan-y: a vertical swipe still scrolls the page, a horizontal one drags the row.
        "relative cursor-grab touch-pan-y select-none overflow-hidden data-[dragging=true]:cursor-grabbing",
        className
      )}
    >
      <div ref={trackRef} className="flex w-max will-change-transform">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            ref={copy === 0 ? copyRef : undefined}
            className="flex shrink-0"
            aria-hidden={copy === 1 ? true : undefined}
            inert={copy === 1 ? true : undefined}
          >
            {items.map((item, index) => (
              <div key={index} dir={itemDir} className={cn("shrink-0 pr-3", itemClassName)}>
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

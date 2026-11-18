"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * A row that moves continuously, with no stop between items. The items are drawn twice
 * and the track slides by half its width, so the loop has no seam.
 *
 * - `reverse`: false moves right to left, true moves left to right (on screen, whatever the language).
 * - `paused`: freezes the row (the pause button of the section).
 * - `secondsPerItem`: speed; the row lasts `items × secondsPerItem` seconds per loop.
 * - Reduced motion: no movement, the row scrolls by hand instead.
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
  if (items.length === 0) return null
  const duration = `${Math.max(20, items.length * secondsPerItem)}s`

  return (
    <div
      dir="ltr"
      role={label ? "group" : undefined}
      aria-label={label}
      className={cn(
        "relative overflow-hidden motion-reduce:overflow-x-auto",
        className
      )}
    >
      {/* dir="ltr" on the row: the slide is a screen direction (and an RTL page would pin the track
          to the right edge); each card gets back the page language through `itemDir`. */}
      <div
        className="flex w-max animate-[bd-marquee_var(--marquee-duration)_linear_infinite] motion-reduce:animate-none"
        style={{
          ["--marquee-duration" as string]: duration,
          animationDirection: reverse ? "reverse" : "normal",
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0" aria-hidden={copy === 1 ? true : undefined} inert={copy === 1 ? true : undefined}>
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

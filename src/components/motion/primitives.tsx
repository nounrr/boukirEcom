"use client"

/**
 * Shared micro-motion library (client side). Presentation only — none of
 * these ever alter the numbers they display.
 */
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const

function usePrefersReducedMotion() {
  const reduce = useReducedMotion()
  return reduce === true
}

/* ── Number transition ──────────────────────────────────────────────────── */

export function formatNumber(value: number, locale: string, decimals = 0) {
  const tag = locale === "ar" ? "ar-MA" : locale === "zh" ? "zh-CN" : locale === "en" ? "en-GB" : "fr-FR"
  return new Intl.NumberFormat(tag, { maximumFractionDigits: decimals, minimumFractionDigits: 0 }).format(value)
}

/**
 * Tweens the *displayed* value towards `value`. The underlying figure is
 * always the exact computed result; screen readers receive the final value.
 */
export function AnimatedNumber({
  value,
  locale,
  decimals = 0,
  duration = 650,
  className,
  fromZeroOnView = false,
}: {
  value: number
  locale: string
  decimals?: number
  duration?: number
  className?: string
  /** count up from 0 the first time the number scrolls into view */
  fromZeroOnView?: boolean
}) {
  const reduce = usePrefersReducedMotion()
  const [display, setDisplay] = useState(fromZeroOnView ? 0 : value)
  const fromRef = useRef(fromZeroOnView ? 0 : value)
  const frameRef = useRef<number | null>(null)
  const spanRef = useRef<HTMLSpanElement>(null)
  const [armed, setArmed] = useState(!fromZeroOnView)

  useEffect(() => {
    if (armed || !spanRef.current) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setArmed(true)
          io.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    io.observe(spanRef.current)
    return () => io.disconnect()
  }, [armed])

  useEffect(() => {
    if (!armed) return
    if (reduce) {
      setDisplay(value)
      fromRef.current = value
      return
    }
    const from = fromRef.current
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 4)
      const next = from + (value - from) * eased
      setDisplay(next)
      if (p < 1) frameRef.current = requestAnimationFrame(tick)
      else fromRef.current = value
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      fromRef.current = value
    }
  }, [value, duration, reduce, armed])

  return (
    <span ref={spanRef} className={cn("tabular", className)}>
      <span aria-hidden="true">{formatNumber(display, locale, decimals)}</span>
      <span className="sr-only">{formatNumber(value, locale, decimals)}</span>
    </span>
  )
}

/* ── Restrained parallax for large imagery ─────────────────────────────── */

export function Parallax({ children, strength = 60, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = usePrefersReducedMotion()
  const [enabled, setEnabled] = useState(false)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], [-strength, strength])

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)")
    const update = () => setEnabled(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <motion.div className="absolute inset-[-12%_0]" style={enabled && !reduce ? { y } : undefined}>
        {children}
      </motion.div>
    </div>
  )
}

/* ── Magnetic CTA (desktop fine pointers only) ─────────────────────────── */

export function Magnetic({ children, strength = 6, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = usePrefersReducedMotion()
  const [style, setStyle] = useState<CSSProperties>({})

  const onMove = (event: React.PointerEvent) => {
    if (reduce || event.pointerType !== "mouse" || !ref.current) return
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return
    const rect = ref.current.getBoundingClientRect()
    const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
    const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
    setStyle({ transform: `translate3d(${dx * strength}px, ${dy * strength * 0.6}px, 0)` })
  }

  return (
    <span
      ref={ref}
      className={cn("inline-flex transition-transform duration-300 ease-[var(--ease-premium)]", className)}
      style={style}
      onPointerMove={onMove}
      onPointerLeave={() => setStyle({})}
    >
      {children}
    </span>
  )
}

/* ── Scroll progress for a section (0 → 1) ─────────────────────────────── */

export function useSectionProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  return { ref, progress: scrollYProgress }
}

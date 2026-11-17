"use client"

import useEmblaCarousel from "embla-carousel-react"
import AutoScroll from "embla-carousel-auto-scroll"
import type { EmblaOptionsType } from "embla-carousel"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import { Children, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

/**
 * Premium draggable carousel (mouse, touch and trackpad) built on Embla.
 *
 * - Autoplay advances one slide every `autoplay` ms and pauses while the
 *   pointer hovers it, while it has keyboard focus, during a drag, when the
 *   tab is hidden or the carousel is off-screen, and when the user presses
 *   the pause button (WCAG 2.2.2). It never fights the user's own drag.
 * - Arrow keys move between slides when the carousel has focus.
 * - `glide` instead: the strip moves continuously (no stop between cards) at that speed,
 *   with the same pauses (hover, focus, drag, off-screen, pause button, reduced motion).
 * - RTL aware.
 */
export function DragCarousel({
  children,
  label,
  autoplay = 0,
  glide = 0,
  options,
  slideClassName,
  className,
  tone = "auto",
  controls = "top",
  showProgress = true,
}: {
  children: ReactNode
  /** accessible name for the carousel region */
  label: string
  /** autoplay interval in ms, 0 disables */
  autoplay?: number
  /** continuous scrolling speed (pixels per frame, ~0.5 to 1), 0 disables; replaces `autoplay` */
  glide?: number
  options?: EmblaOptionsType
  slideClassName?: string
  className?: string
  tone?: "auto" | "dark"
  controls?: "top" | "bottom" | "none"
  showProgress?: boolean
}) {
  const t = useTranslations("xp.carousel")
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr")
  // Continuous mode: Embla's AutoScroll, started and stopped only by us (see `running`).
  const plugins = useMemo(
    () => (glide > 0 ? [AutoScroll({ speed: glide, startDelay: 0, playOnInit: false, stopOnInteraction: false, stopOnMouseEnter: false, stopOnFocusIn: false })] : []),
    [glide]
  )
  const [viewportRef, api] = useEmblaCarousel({ align: "start", loop: true, dragFree: glide > 0, containScroll: "trimSnaps", direction, ...options }, plugins)
  const rootRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState(0)
  const [snaps, setSnaps] = useState<number[]>([])
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    if (rootRef.current) setDirection(getComputedStyle(rootRef.current).direction === "rtl" ? "rtl" : "ltr")
  }, [])

  const sync = useCallback(() => {
    if (!api) return
    setSelected(api.selectedScrollSnap())
    setSnaps(api.scrollSnapList())
  }, [api])

  useEffect(() => {
    if (!api) return
    sync()
    const onScroll = () => setProgress(Math.max(0, Math.min(1, api.scrollProgress())))
    const onDown = () => setDragging(true)
    const onSettle = () => setDragging(false)
    api.on("select", sync).on("reInit", sync).on("scroll", onScroll).on("pointerDown", onDown).on("settle", onSettle).on("pointerUp", onSettle)
    onScroll()
    return () => {
      api.off("select", sync).off("reInit", sync).off("scroll", onScroll).off("pointerDown", onDown).off("settle", onSettle).off("pointerUp", onSettle)
    }
  }, [api, sync])

  // Only autoplay while on screen.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const canScroll = snaps.length > 1
  const moving = glide > 0 || autoplay > 0
  const running = moving && canScroll && !paused && !hovered && !focused && !dragging && visible && !(glide > 0 && reducedMotion)
  const runningRef = useRef(running)
  useEffect(() => { runningRef.current = running }, [running])

  // Continuous mode: play while `running`, and pick up again after the arrows have moved the strip.
  useEffect(() => {
    const auto = glide > 0 ? api?.plugins()?.autoScroll : undefined
    if (!api || !auto) return
    if (running && !auto.isPlaying()) auto.play()
    if (!running && auto.isPlaying()) auto.stop()
    const resume = () => { if (runningRef.current && !auto.isPlaying()) auto.play() }
    api.on("settle", resume)
    return () => { api.off("settle", resume) }
  }, [api, glide, running])

  // Arrows: in continuous mode, stop the glide so the jump is clean (it resumes on "settle").
  const step = (forward: boolean) => {
    const auto = glide > 0 ? api?.plugins()?.autoScroll : undefined
    if (auto?.isPlaying()) auto.stop()
    if (forward) api?.scrollNext()
    else api?.scrollPrev()
  }

  useEffect(() => {
    if (!api || !running || glide > 0) return
    const id = window.setInterval(() => {
      if (document.hidden) return
      api.scrollNext()
    }, autoplay)
    return () => window.clearInterval(id)
  }, [api, running, autoplay, glide])

  const count = Children.count(children)
  const btn =
    tone === "dark"
      ? "border-white/20 text-white hover:border-white/50 disabled:opacity-30"
      : "border-border text-foreground hover:border-foreground/40 disabled:opacity-30"

  const controlBar =
    controls === "none" || !canScroll ? null : (
      <div className="flex items-center gap-2">
        {moving ? (
          <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? t("play") : t("pause")} className={cn("grid size-11 place-items-center rounded-full border transition-colors", btn)}>
            {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          </button>
        ) : null}
        <button type="button" onClick={() => step(false)} aria-label={t("prev")} className={cn("grid size-11 place-items-center rounded-full border transition-colors", btn)}>
          <ChevronLeft className="size-5 rtl:rotate-180" />
        </button>
        <button type="button" onClick={() => step(true)} aria-label={t("next")} className={cn("grid size-11 place-items-center rounded-full border transition-colors", btn)}>
          <ChevronRight className="size-5 rtl:rotate-180" />
        </button>
      </div>
    )

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
      }}
      onKeyDown={(e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
        if ((e.target as HTMLElement).closest("input, textarea, select")) return
        const forward = (e.key === "ArrowRight") !== (direction === "rtl")
        step(forward)
      }}
    >
      {controls === "top" && controlBar ? <div className="mb-5 flex justify-end">{controlBar}</div> : null}
      <div ref={viewportRef} className={cn("overflow-hidden", dragging ? "cursor-grabbing" : "cursor-grab")}>
        <div className="flex touch-pan-y gap-4 [backface-visibility:hidden]">
          {Children.map(children, (child, index) => (
            <div
              className={cn("min-w-0 shrink-0 grow-0 select-none", slideClassName)}
              role="group"
              aria-roledescription="slide"
              aria-label={t("slideOf", { current: index + 1, total: count })}
            >
              {child}
            </div>
          ))}
        </div>
      </div>
      {(showProgress && canScroll) || controls === "bottom" ? (
        <div className="mt-6 flex items-center gap-5">
          {showProgress && canScroll ? (
            <div className={cn("relative h-px flex-1 overflow-hidden", tone === "dark" ? "bg-white/15" : "bg-border")} aria-hidden="true">
              <div className="absolute inset-y-0 start-0 bg-gold transition-[width] duration-300" style={{ width: `${Math.max(8, progress * 100)}%` }} />
            </div>
          ) : null}
          {showProgress && canScroll ? (
            <span className={cn("text-xs tabular", tone === "dark" ? "text-white/50" : "text-muted-foreground")} aria-live="polite">
              {String(selected + 1).padStart(2, "0")} / {String(snaps.length).padStart(2, "0")}
            </span>
          ) : null}
          {controls === "bottom" ? controlBar : null}
        </div>
      ) : null}
    </div>
  )
}

"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Calculator, ChevronsDown, ClipboardList } from "lucide-react"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useRef, useState } from "react"

import { BrandLockup } from "@/components/brand/brand-lockup"
import { catalogHref } from "@/lib/catalog/registry"
import { cn } from "@/lib/utils"

/**
 * « De l'idée à la réalité » — scroll-controlled construction timelapse.
 *
 * Scroll position drives the footage directly: down builds, up un-builds,
 * stopping stops. No autoplay, no player controls, no scroll hijacking —
 * the stage is pinned with native `position: sticky` inside a tall section.
 *
 * Desktop: the H.264 file (GOP 8, no B-frames, faststart) is fetched once as
 * a Blob so every seek is local; a rAF loop issues a new seek only after the
 * previous one has completed. Touch / small screens: a 95-frame WebP
 * sequence drawn on a canvas (iOS seeks unreliably). Chapter boundaries come
 * from the actual footage (frame indices / 190 frames), not assumptions.
 */

const VIDEO_DESKTOP = "/videos/villa/villa-1080.mp4"
const VIDEO_TABLET = "/videos/villa/villa-720.mp4"
const FRAME_COUNT = 95
const frameSrc = (i: number) => `/videos/villa/frames/f${String(i).padStart(3, "0")}.webp`

/** Fraction of the scroll used before/after the footage, so stage 1 and the final CTA can be read. */
const HOLD_START = 0.02
const HOLD_END = 0.08

type Chapter = { key: string; start: number; cta?: { href: string; label: string; icon: "calc" | "plan" | "arrow" } }

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const dw = img.naturalWidth * scale
  const dh = img.naturalHeight * scale
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
}

export function ConstructionSequence({ locale }: { locale: string }) {
  const t = useTranslations("xp.home.sequence")

  // Boundaries measured on the footage: terrain f0, foundations f20, structure f52,
  // masonry f76, waterproofing/render f102, coverings f118, finishes f148, completion f175.
  const chapters: Chapter[] = [
    { key: "terrain", start: 0, cta: { href: `/${locale}/projet`, label: t("cta.plan"), icon: "plan" } },
    { key: "foundations", start: 20 / 190, cta: { href: `/${locale}/calculateurs/beton`, label: t("cta.concrete"), icon: "calc" } },
    { key: "structure", start: 52 / 190, cta: { href: catalogHref(locale, "categories", 73), label: t("cta.structure"), icon: "arrow" } },
    { key: "masonry", start: 76 / 190, cta: { href: `/${locale}/calculateurs/murs-blocs`, label: t("cta.bricks"), icon: "calc" } },
    { key: "waterproofing", start: 102 / 190, cta: { href: `/${locale}/calculateurs/etancheite`, label: t("cta.waterproofing"), icon: "calc" } },
    { key: "coverings", start: 118 / 190, cta: { href: `/${locale}/calculateurs/carrelage`, label: t("cta.tiles"), icon: "calc" } },
    { key: "finishes", start: 148 / 190, cta: { href: `/${locale}/calculateurs/peinture`, label: t("cta.paint"), icon: "calc" } },
    { key: "reality", start: 175 / 190 },
  ]

  const sectionRef = useRef<HTMLElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const framesRef = useRef<(HTMLImageElement | null)[]>([])

  const [mode, setMode] = useState<"pending" | "video" | "frames">("pending")
  const [near, setNear] = useState(false)
  const [ready, setReady] = useState(false)
  const [loadPct, setLoadPct] = useState(0)
  const [chapter, setChapter] = useState(0)

  // Pick the rendering strategy once on the client.
  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches
    setMode(coarse || window.innerWidth < 768 ? "frames" : "video")
  }, [])

  // Start loading once the page has fully loaded (never competes with the
  // first render) and the section is within ~1 viewport.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    let io: IntersectionObserver | null = null
    const arm = () => {
      io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setNear(true)
          io?.disconnect()
        }
      }, { rootMargin: "120% 0px 120% 0px" })
      io.observe(el)
    }
    if (document.readyState === "complete") arm()
    else window.addEventListener("load", arm, { once: true })
    return () => {
      window.removeEventListener("load", arm)
      io?.disconnect()
    }
  }, [])

  // ── Video: fetch once as a Blob for instant local seeking ─────────────
  useEffect(() => {
    if (mode !== "video" || !near) return
    const video = videoRef.current
    if (!video) return
    const src = window.innerWidth >= 1400 && (window.devicePixelRatio || 1) >= 1 ? VIDEO_DESKTOP : VIDEO_TABLET
    const controller = new AbortController()
    let objectUrl: string | null = null
    const onReady = () => setReady(true)
    const onError = () => setMode("frames")
    video.addEventListener("loadeddata", onReady, { once: true })
    video.addEventListener("error", onError, { once: true })

    ;(async () => {
      try {
        const res = await fetch(src, { signal: controller.signal })
        if (!res.ok || !res.body) throw new Error("fetch failed")
        const total = Number(res.headers.get("content-length")) || 0
        const reader = res.body.getReader()
        const chunks: BlobPart[] = []
        let received = 0
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
          received += value.length
          if (total) setLoadPct(Math.round((received / total) * 100))
        }
        objectUrl = URL.createObjectURL(new Blob(chunks, { type: "video/mp4" }))
        video.src = objectUrl
        video.load()
      } catch (error) {
        if ((error as DOMException)?.name === "AbortError") return
        // Network streaming fallback (range requests).
        video.preload = "auto"
        video.src = src
        video.load()
      }
    })()

    return () => {
      controller.abort()
      video.removeEventListener("loadeddata", onReady)
      video.removeEventListener("error", onError)
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [mode, near])

  // ── Frames: coarse-to-fine progressive loading ────────────────────────
  useEffect(() => {
    if (mode !== "frames" || !near) return
    let cancelled = false
    const order: number[] = []
    const seen = new Set<number>()
    for (const step of [16, 8, 4, 2, 1]) {
      for (let i = 0; i < FRAME_COUNT; i += step) if (!seen.has(i)) (seen.add(i), order.push(i))
    }
    if (!seen.has(FRAME_COUNT - 1)) order.splice(1, 0, FRAME_COUNT - 1)
    framesRef.current = new Array(FRAME_COUNT).fill(null)
    let loaded = 0
    let cursor = 0
    const loadNext = () => {
      if (cancelled || cursor >= order.length) return
      const index = order[cursor++]
      const img = new window.Image()
      img.decoding = "async"
      img.onload = () => {
        if (cancelled) return
        framesRef.current[index] = img
        loaded += 1
        setLoadPct(Math.round((loaded / FRAME_COUNT) * 100))
        if (index === 0) setReady(true)
        loadNext()
      }
      img.onerror = loadNext
      img.src = frameSrc(index)
    }
    for (let k = 0; k < 6; k++) loadNext()
    return () => {
      cancelled = true
    }
  }, [mode, near])

  // Keep the canvas backing store matched to its box.
  useEffect(() => {
    if (mode !== "frames") return
    const canvas = canvasRef.current
    const box = mediaRef.current
    if (!canvas || !box) return
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(box.clientWidth * dpr)
      canvas.height = Math.round(box.clientHeight * dpr)
      canvas.dataset.dirty = "1"
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(box)
    return () => ro.disconnect()
  }, [mode])

  // ── Scroll → time loop (runs only while the section is on screen) ─────
  useEffect(() => {
    const section = sectionRef.current
    if (!section || mode === "pending") return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let raf = 0
    let running = false
    let smooth = -1
    let seeking = false
    let seekTimer = 0
    let lastChapter = -1
    let lastFrame = -1
    const video = videoRef.current
    const onSeeked = () => {
      seeking = false
      window.clearTimeout(seekTimer)
    }
    video?.addEventListener("seeked", onSeeked)

    const tick = () => {
      const rect = section.getBoundingClientRect()
      const span = Math.max(1, rect.height - window.innerHeight)
      const p = clamp(-rect.top / span)
      const time = clamp((p - HOLD_START) / (1 - HOLD_START - HOLD_END))
      smooth = smooth < 0 || reduce ? time : smooth + (time - smooth) * 0.3
      if (Math.abs(time - smooth) < 0.0008) smooth = time

      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`
      if (railRef.current) railRef.current.style.transform = `scaleY(${time})`

      let idx = 0
      for (let i = 0; i < chapters.length; i++) if (time >= chapters[i].start - 0.0001) idx = i
      if (idx !== lastChapter) {
        lastChapter = idx
        setChapter(idx)
      }

      if (mode === "video" && video && video.readyState >= 1 && Number.isFinite(video.duration) && video.duration > 0) {
        const target = smooth * Math.max(0, video.duration - 0.05)
        if (!seeking && Math.abs(video.currentTime - target) > 1 / 48) {
          seeking = true
          video.currentTime = target
          seekTimer = window.setTimeout(() => (seeking = false), 300)
        }
      } else if (mode === "frames") {
        const canvas = canvasRef.current
        const frame = Math.round(smooth * (FRAME_COUNT - 1))
        if (canvas && (frame !== lastFrame || canvas.dataset.dirty === "1")) {
          // nearest loaded frame (coarse frames arrive first)
          let img: HTMLImageElement | null = null
          for (let d = 0; d < FRAME_COUNT && !img; d++) img = framesRef.current[frame - d] ?? framesRef.current[frame + d] ?? null
          const ctx = canvas.getContext("2d")
          if (img && ctx) {
            drawCover(ctx, img, canvas.width, canvas.height)
            canvas.dataset.dirty = ""
            if (framesRef.current[frame]) lastFrame = frame
          }
        }
      }
      if (running) raf = requestAnimationFrame(tick)
    }

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true
        raf = requestAnimationFrame(tick)
      } else if (!entry.isIntersecting && running) {
        running = false
        cancelAnimationFrame(raf)
        tick() // settle on the exact boundary state
      }
    })
    io.observe(section)
    const onResize = () => !running && tick()
    window.addEventListener("resize", onResize)
    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.clearTimeout(seekTimer)
      io.disconnect()
      window.removeEventListener("resize", onResize)
      video?.removeEventListener("seeked", onSeeked)
    }
    // chapters are derived from locale only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, ready, locale])

  /** Jump to a chapter by scrolling (keeps native scroll in control). */
  const goToChapter = useCallback(
    (index: number) => {
      const section = sectionRef.current
      if (!section) return
      const top = section.getBoundingClientRect().top + window.scrollY
      const span = section.offsetHeight - window.innerHeight
      const time = Math.min(1, chapters[index].start + 0.012)
      const p = HOLD_START + time * (1 - HOLD_START - HOLD_END)
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      window.scrollTo({ top: top + p * span + 2, behavior: reduce ? "auto" : "smooth" })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale]
  )

  const isFinal = chapter === chapters.length - 1

  return (
    <section
      id="construction"
      ref={sectionRef}
      data-sequence
      data-no-reveal
      className="relative h-[420vh] bg-ink text-white lg:h-[520vh]"
      aria-labelledby="sequence-title"
    >
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
        {/* Media */}
        <div
          ref={mediaRef}
          className="relative order-2 mx-4 my-auto aspect-[4/3] shrink-0 overflow-hidden rounded-3xl bg-ink-2 sm:mx-8 lg:absolute lg:my-0 lg:inset-0 lg:order-none lg:m-0 lg:aspect-auto lg:rounded-none"
          aria-hidden="true"
        >
          <Image src={isFinal && !ready ? "/videos/villa/poster-end.webp" : "/videos/villa/poster-start.webp"} alt="" fill sizes="100vw" className="object-cover" priority={false} />
          {mode === "video" ? (
            <video
              ref={videoRef}
              muted
              playsInline
              preload="none"
              disablePictureInPicture
              disableRemotePlayback
              tabIndex={-1}
              data-fade-ok
              className={cn("absolute inset-0 size-full object-cover transition-opacity duration-700", ready ? "opacity-100" : "opacity-0")}
            />
          ) : null}
          {mode === "frames" ? <canvas ref={canvasRef} data-fade-ok className={cn("absolute inset-0 size-full transition-opacity duration-700", ready ? "opacity-100" : "opacity-0")} /> : null}
          <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(13,13,13,0.92)_0%,rgba(13,13,13,0.6)_34%,rgba(13,13,13,0.05)_62%,rgba(13,13,13,0.35)_100%)] lg:block rtl:bg-[linear-gradient(270deg,rgba(13,13,13,0.92)_0%,rgba(13,13,13,0.6)_34%,rgba(13,13,13,0.05)_62%,rgba(13,13,13,0.35)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/85 to-transparent lg:h-1/4" />
          <div className="absolute inset-x-0 top-0 hidden h-40 bg-gradient-to-b from-ink/80 to-transparent lg:block" />
        </div>

        {/* Heading + chapter copy */}
        <div className="relative order-1 px-5 pb-4 pt-[4.5rem] sm:px-8 lg:absolute lg:inset-y-0 lg:start-0 lg:flex lg:w-[48%] lg:flex-col lg:justify-center lg:px-10 lg:pb-24 lg:pt-32">
          <p className="kicker !text-brand-yellow flex items-center gap-3">
            <span className="h-px w-8 bg-brand-yellow" aria-hidden="true" />
            {t("kicker")}
          </p>
          <h2 id="sequence-title" className="mt-2 max-w-md text-base font-semibold uppercase tracking-[0.14em] text-white/80 lg:mt-3 lg:text-sm rtl:tracking-normal">
            {t("title")}
          </h2>

          <div className="relative mt-4 min-h-[148px] lg:mt-12 lg:min-h-[330px]">
            {chapters.map((c, index) => {
              const state = index === chapter ? "active" : index < chapter ? "past" : "future"
              const final = index === chapters.length - 1
              return (
                <div key={c.key} className="seq-chapter absolute inset-x-0 top-0" data-state={state} aria-hidden={state !== "active"} inert={state !== "active"}>
                  {final ? (
                    <div>
                      <div className="seq-item" style={{ ["--d" as string]: "0ms" }}>
                        <BrandLockup compact />
                      </div>
                      <p className="seq-item mt-4 font-display text-[2.1rem] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-[4.2rem] rtl:tracking-normal" style={{ ["--d" as string]: "90ms" }}>
                        {t("finalTitle")}
                      </p>
                      <p className="seq-item mt-3 max-w-md text-sm leading-relaxed text-white/70 lg:mt-5 lg:text-lg" style={{ ["--d" as string]: "180ms" }}>
                        {t(`chapters.${c.key}.text`)}
                      </p>
                      <div className="seq-item mt-4 flex flex-wrap gap-2.5 lg:mt-8" style={{ ["--d" as string]: "270ms" }}>
                        <Link href={`/${locale}/projet`} className="inline-flex h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-ink lg:h-13 lg:px-7">
                          <ClipboardList className="size-4" aria-hidden="true" />
                          {t("cta.start")}
                        </Link>
                        <Link href={`/${locale}/calculateurs/budget`} className="inline-flex h-11 items-center gap-2 rounded-full border border-white/25 px-5 text-sm font-semibold text-white hover:border-white/60 lg:h-13 lg:px-7">
                          {t("cta.estimate")}
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="seq-item flex items-baseline gap-3 font-semibold tabular" style={{ ["--d" as string]: "0ms" }}>
                        <span className="text-4xl font-extrabold text-gold lg:text-6xl">{String(index + 1).padStart(2, "0")}</span>
                        <span className="text-xs uppercase tracking-[0.2em] text-white/50 rtl:tracking-normal">/ 08</span>
                      </p>
                      <h3 className="seq-item mt-2 font-display text-[2rem] font-extrabold uppercase leading-[0.98] tracking-[-0.03em] sm:text-5xl lg:mt-4 lg:text-[4.4rem] rtl:tracking-normal" style={{ ["--d" as string]: "80ms" }}>
                        {t(`chapters.${c.key}.title`)}
                      </h3>
                      <p className="seq-item mt-3 max-w-md text-sm leading-relaxed text-white/70 lg:mt-5 lg:text-xl" style={{ ["--d" as string]: "170ms" }}>
                        {t(`chapters.${c.key}.text`)}
                      </p>
                      {c.cta ? (
                        <div className="seq-item mt-4 lg:mt-8" style={{ ["--d" as string]: "260ms" }}>
                          <Link
                            href={c.cta.href}
                            className="group inline-flex h-11 items-center gap-2 rounded-full border border-brand-orange/50 bg-brand-orange/10 px-5 text-sm font-semibold text-brand-yellow backdrop-blur-md transition-colors hover:bg-brand-orange hover:text-ink lg:h-12"
                          >
                            {c.cta.icon === "calc" ? <Calculator className="size-4" aria-hidden="true" /> : c.cta.icon === "plan" ? <ClipboardList className="size-4" aria-hidden="true" /> : null}
                            {c.cta.label}
                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden="true" />
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Stage indicator (desktop) */}
        <nav className="absolute end-8 top-1/2 z-10 hidden -translate-y-1/2 lg:block xl:end-10" aria-label={t("indicator")}>
          <div className="relative ps-6 rtl:ps-0 rtl:pe-6">
            <span className="absolute bottom-2 start-[5px] top-2 w-px bg-white/15 rtl:start-auto rtl:end-[5px]" aria-hidden="true" />
            <span className="absolute bottom-2 start-[5px] top-2 w-px overflow-hidden rtl:start-auto rtl:end-[5px]" aria-hidden="true">
              <span ref={railRef} className="block h-full w-full origin-top bg-gold" style={{ transform: "scaleY(0)" }} />
            </span>
            <ol className="space-y-3.5">
              {chapters.map((c, index) => (
                <li key={c.key}>
                  <button
                    type="button"
                    onClick={() => goToChapter(index)}
                    aria-current={index === chapter ? "step" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 text-start text-xs font-semibold uppercase tracking-[0.16em] transition-colors duration-500 rtl:tracking-normal",
                      index === chapter ? "text-white" : index < chapter ? "text-white/55" : "text-white/35 hover:text-white/70"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute -start-6 grid size-[11px] place-items-center rounded-full border transition-all duration-500 rtl:-start-auto rtl:-end-6",
                        index === chapter ? "scale-125 border-brand-orange bg-brand-orange" : index < chapter ? "border-brand-orange bg-ink" : "border-white/30 bg-ink"
                      )}
                      aria-hidden="true"
                    />
                    <span className="tabular">{String(index + 1).padStart(2, "0")}</span>
                    <span className={cn("transition-[opacity,transform] duration-500", index === chapter ? "translate-x-0 opacity-100" : "opacity-70")}>{t(`chapters.${c.key}.title`)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        {/* Progress line, mobile stage dots, loading state */}
        <div className="relative order-3 mt-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 sm:px-8 lg:absolute lg:inset-x-0 lg:bottom-0 lg:z-10 lg:px-10 lg:pb-8">
          <div className="mb-3 flex items-center justify-between gap-4 pe-16 text-[11px] font-medium uppercase tracking-[0.18em] text-white/50 lg:pe-0 rtl:tracking-normal">
            <span className="flex items-center gap-2">
              <ChevronsDown className="size-3.5 motion-safe:animate-bounce" aria-hidden="true" />
              {t("scrollHint")}
            </span>
            {!ready || loadPct < 100 ? (
              <span className="tabular" role="status">
                {t("loading")} {loadPct > 0 ? `${loadPct} %` : ""}
              </span>
            ) : (
              <span className="tabular">{String(chapter + 1).padStart(2, "0")} / 08</span>
            )}
          </div>
          <div className="relative h-[2px] overflow-hidden rounded-full bg-white/15" aria-hidden="true">
            <div ref={barRef} className="absolute inset-0 origin-left bg-gold rtl:origin-right" style={{ transform: "scaleX(0)" }} />
          </div>
          <div className="mt-3 flex justify-between gap-1 pe-16 lg:hidden">
            {chapters.map((c, index) => (
              <button
                key={c.key}
                type="button"
                onClick={() => goToChapter(index)}
                aria-label={t(`chapters.${c.key}.title`)}
                aria-current={index === chapter ? "step" : undefined}
                className="grid h-8 flex-1 place-items-center"
              >
                <span className={cn("h-1.5 rounded-full transition-all duration-500", index === chapter ? "w-6 bg-brand-orange" : index < chapter ? "w-1.5 bg-brand-orange/70" : "w-1.5 bg-white/25")} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

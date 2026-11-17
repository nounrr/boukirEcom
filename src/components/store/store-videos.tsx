"use client"

import { Pause, Play } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import { STORE_VIDEOS, type StoreVideo } from "@/lib/store-media"

/** Vidéo muette qui se lance quand elle est visible et s'arrête hors écran (mouvement réduit : lecture à la demande). */
export function StoreVideoCard({ video, className, label }: { video: StoreVideo; className?: string; label: string }) {
  const t = useTranslations("storePage.videos")
  const ref = useRef<HTMLVideoElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [manualPause, setManualPause] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !manualPause) void element.play().catch(() => {})
      else element.pause()
    }, { threshold: 0.35 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [manualPause])

  const toggle = () => {
    const element = ref.current
    if (!element) return
    if (element.paused) {
      setManualPause(false)
      void element.play().catch(() => {})
    } else {
      setManualPause(true)
      element.pause()
    }
  }

  return (
    <figure className={cn("group relative overflow-hidden rounded-3xl bg-ink", className)}>
      <video
        ref={ref}
        src={video.src}
        poster={video.poster}
        muted
        loop
        playsInline
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="size-full object-cover"
        aria-label={label}
      />
      <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/0 to-black/10" aria-hidden="true" />
      <figcaption className="absolute bottom-4 start-4 end-16 text-sm font-semibold text-white drop-shadow">{label}</figcaption>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? t("pause") : t("play")}
        className="absolute bottom-3 end-3 grid size-10 place-items-center rounded-full bg-white/90 text-neutral-900 shadow-lg transition-colors duration-500 hover:bg-gold"
      >
        {playing ? <Pause className="size-4" /> : <Play className="size-4 translate-x-px" />}
      </button>
    </figure>
  )
}

/** Mosaïque des vidéos du magasin (horizontales et verticales). */
export function StoreVideos() {
  const t = useTranslations("storePage.videos")
  const [featured, ...rest] = STORE_VIDEOS
  return (
    // Placement « dense » : les vidéos verticales se rangent côte à côte sur mobile, et la
    // dernière vidéo horizontale prend deux colonnes pour fermer la grille sans trou.
    <div className="grid grid-flow-row-dense auto-rows-[220px] grid-cols-2 gap-3 md:auto-rows-[240px] md:grid-cols-4">
      <StoreVideoCard video={featured} label={t(`labels.${featured.key}`)} className="col-span-2 row-span-2" />
      {rest.map((video, index) => (
        <StoreVideoCard
          key={video.key}
          video={video}
          label={t(`labels.${video.key}`)}
          className={video.portrait ? "row-span-2" : index === rest.length - 1 ? "col-span-2" : "col-span-2 md:col-span-1"}
        />
      ))}
    </div>
  )
}

"use client"

import Image from "next/image"
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useState } from "react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { STORE_PHOTOS } from "@/lib/store-media"

/** Galerie des photos du magasin (mosaïque) avec visionneuse plein écran. */
export function StoreGallery({ limit }: { limit?: number }) {
  const t = useTranslations("storePage.gallery")
  const photos = typeof limit === "number" ? STORE_PHOTOS.slice(0, limit) : STORE_PHOTOS
  const [open, setOpen] = useState<number | null>(null)

  const go = useCallback((step: number) => {
    setOpen((current) => (current === null ? current : (current + step + photos.length) % photos.length))
  }, [photos.length])

  useEffect(() => {
    if (open === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(document.documentElement.dir === "rtl" ? -1 : 1)
      if (event.key === "ArrowLeft") go(document.documentElement.dir === "rtl" ? 1 : -1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, go])

  const current = open === null ? null : photos[open]

  return (
    <>
      <div className="columns-2 gap-3 md:columns-3 lg:columns-4 [&>*]:mb-3">
        {photos.map((photo, index) => (
          <button
            key={photo.src}
            type="button"
            onClick={() => setOpen(index)}
            className="group relative block w-full break-inside-avoid overflow-hidden rounded-2xl bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={t("open", { index: index + 1 })}
          >
            <Image
              src={photo.src}
              alt={t("alt", { index: index + 1 })}
              width={photo.width}
              height={photo.height}
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="h-auto w-full transition-[scale] duration-[900ms] ease-hover group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
            <span className="absolute bottom-3 end-3 grid size-9 place-items-center rounded-full bg-white/90 text-neutral-900 opacity-0 shadow-lg transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true">
              <Expand className="size-4" />
            </span>
          </button>
        ))}
      </div>

      <Dialog open={open !== null} onOpenChange={(value) => { if (!value) setOpen(null) }}>
        <DialogContent showCloseButton={false} overlayClassName="bg-black/90 backdrop-blur-sm" className="max-w-[min(1200px,94vw)] border-0 bg-transparent p-0 shadow-none sm:max-w-[min(1200px,94vw)]">
          <DialogTitle className="sr-only">{t("viewerTitle")}</DialogTitle>
          {current ? (
            <div className="relative">
              <Image
                src={current.src}
                alt={t("alt", { index: (open ?? 0) + 1 })}
                width={current.width}
                height={current.height}
                sizes="94vw"
                className="mx-auto max-h-[82vh] w-auto rounded-2xl object-contain"
                priority
              />
              <div className="absolute inset-x-0 -bottom-12 flex items-center justify-center gap-3 text-sm text-white">
                <button type="button" onClick={() => go(-1)} aria-label={t("previous")} className="grid size-10 place-items-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25">
                  <ChevronLeft className="size-5 rtl:rotate-180" />
                </button>
                <span className="tabular">{(open ?? 0) + 1} / {photos.length}</span>
                <button type="button" onClick={() => go(1)} aria-label={t("next")} className="grid size-10 place-items-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25">
                  <ChevronRight className="size-5 rtl:rotate-180" />
                </button>
              </div>
              <button type="button" onClick={() => setOpen(null)} aria-label={t("close")} className="absolute end-3 top-3 grid size-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25">
                <X className="size-5" />
              </button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

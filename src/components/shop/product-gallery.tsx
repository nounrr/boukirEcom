"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toAbsoluteImageUrl } from "@/lib/image-url"
import { getImageEdgeColor } from "@/lib/image-edge-color"
import { ChevronLeft, ChevronRight, Package } from "lucide-react"
import { textureFor } from "@/lib/product-ui"

export interface GalleryImage { id: number; image_url: string }

interface ProductGalleryProps {
  images: GalleryImage[]
  selectedIndex: number
  onSelectedChange: (index: number) => void
  className?: string
  promoPercent?: number | null
  maxHeight?: number
  altText?: string
  onMainClick?: (current: GalleryImage, index: number) => void
  showIndex?: boolean
  thumbSize?: number
  thumbsOnRight?: boolean
  thumbsOnLeft?: boolean
  /** Seed for the material texture shown when there is no usable photo. */
  fallbackSeed?: number | string
}

export function ProductGallery({
  images,
  selectedIndex,
  onSelectedChange,
  className,
  promoPercent,
  maxHeight = 380,
  altText = "Product image",
  onMainClick,
  showIndex = false,
  thumbSize = 48,
  thumbsOnRight = false,
  thumbsOnLeft = false,
  fallbackSeed,
}: ProductGalleryProps) {
  const [brokenIds, setBrokenIds] = useState<Set<number>>(() => new Set())
  const [imageBackgrounds, setImageBackgrounds] = useState<Record<string, string>>({})
  const analyzedSources = useRef(new Set<string>())
  const detectBackground = useCallback((source: string, image: HTMLImageElement) => {
    if (analyzedSources.current.has(source)) return
    analyzedSources.current.add(source)
    const color = getImageEdgeColor(image) || '#ffffff'
    setImageBackgrounds(previous => ({ ...previous, [source]: color }))
  }, [])
  const swipeRef = useRef<{
    pointerId: number | null
    startX: number
    startY: number
    lastX: number
    lastY: number
    moved: boolean
    blockNextClick: boolean
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    moved: false,
    blockNextClick: false,
  })

  const markBroken = useCallback((id: number) => {
    setBrokenIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const resolvedImages = useMemo(() => {
    return (Array.isArray(images) ? images : []).map((img) => ({
      ...img,
      resolvedSrc: toAbsoluteImageUrl(img.image_url),
    }))
  }, [images])

  const hasImages = Array.isArray(images) && images.length > 0
  const current = hasImages ? resolvedImages[Math.max(0, Math.min(selectedIndex, resolvedImages.length - 1))] : undefined

  const goPrev = () => onSelectedChange((selectedIndex - 1 + images.length) % images.length)
  const goNext = () => onSelectedChange((selectedIndex + 1) % images.length)

  const getIsRtl = () => {
    if (typeof document === "undefined") return false
    const dir = document.documentElement?.dir || document.body?.dir
    return (dir || "").toLowerCase() === "rtl"
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (images.length <= 1) return
    swipeRef.current.pointerId = e.pointerId
    swipeRef.current.startX = e.clientX
    swipeRef.current.startY = e.clientY
    swipeRef.current.lastX = e.clientX
    swipeRef.current.lastY = e.clientY
    swipeRef.current.moved = false
    swipeRef.current.blockNextClick = false
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (swipeRef.current.pointerId !== e.pointerId) return
    swipeRef.current.lastX = e.clientX
    swipeRef.current.lastY = e.clientY

    const dx = e.clientX - swipeRef.current.startX
    const dy = e.clientY - swipeRef.current.startY
    if (!swipeRef.current.moved && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      swipeRef.current.moved = true
    }
  }

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (swipeRef.current.pointerId !== e.pointerId) return

    const dx = swipeRef.current.lastX - swipeRef.current.startX
    const dy = swipeRef.current.lastY - swipeRef.current.startY
    swipeRef.current.pointerId = null

    // Only treat mostly-horizontal drags as swipe
    if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) {
      swipeRef.current.blockNextClick = false
      return
    }

    swipeRef.current.blockNextClick = true

    // LTR: swipe left => next, swipe right => prev
    // RTL: invert
    const isRtl = getIsRtl()
    const swipeRight = dx > 0
    if ((swipeRight && !isRtl) || (!swipeRight && isRtl)) {
      goPrev()
    } else {
      goNext()
    }
  }

  const fallback = (size: "lg" | "sm") => (
    <>
      <Image src={textureFor(fallbackSeed ?? altText)} alt="" fill sizes={size === "lg" ? "(min-width: 1024px) 55vw, 100vw" : "96px"} className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/35 to-transparent" aria-hidden="true" />
      <Package className={cn("absolute text-white/85", size === "lg" ? "bottom-4 end-4 size-7" : "bottom-1 end-1 size-3.5")} aria-hidden="true" />
    </>
  )

  const thumb = (image: (typeof resolvedImages)[number], index: number, extra?: string) => (
    <button
      key={image.id}
      type="button"
      onClick={() => onSelectedChange(index)}
      aria-label={`Image ${index + 1}`}
      aria-current={selectedIndex === index ? "true" : undefined}
      className={cn(
        "relative shrink-0 cursor-pointer overflow-hidden rounded-xl border transition-[border-color,box-shadow,opacity,transform] duration-700 ease-[var(--ease-slow)]",
        selectedIndex === index
          ? "border-transparent opacity-100 ring-2 ring-brand-orange ring-offset-2 ring-offset-background"
          : "border-border opacity-70 hover:-translate-y-0.5 hover:opacity-100",
        extra
      )}
      style={{ width: thumbSize, height: thumbSize, backgroundColor: imageBackgrounds[image.resolvedSrc || ''] || '#ffffff' }}
    >
      {image.resolvedSrc && !brokenIds.has(image.id) ? (
        <Image
          src={image.resolvedSrc}
          alt={`Image ${index + 1}`}
          fill
          sizes={`${thumbSize}px`}
          className="object-contain p-1"
          onLoad={(event) => detectBackground(image.resolvedSrc!, event.currentTarget)}
          onError={() => markBroken(image.id)}
        />
      ) : fallback("sm")}
    </button>
  )

  const verticalThumbs = images.length > 1 && (
    <div className="flex flex-col gap-3 overflow-y-auto p-1" style={{ maxHeight }}>
      {resolvedImages.map((image, index) => thumb(image, index))}
    </div>
  )

  const mobileThumbs = images.length > 1 && (
    <div className="w-full overflow-x-auto md:hidden">
      <div className="flex min-w-max gap-2.5 px-1 py-3">
        {resolvedImages.map((image, index) => thumb(image, index))}
      </div>
    </div>
  )

  const showFallback = !current?.resolvedSrc || brokenIds.has(current.id)

  return (
    <div className={cn("w-full lg:sticky lg:top-28", className)}>
      <div className={cn((thumbsOnRight || thumbsOnLeft) ? "flex flex-col items-start gap-3 md:flex-row" : "space-y-3")}>
        {thumbsOnLeft && <div className="hidden md:block">{verticalThumbs}</div>}
        <div className={cn((thumbsOnRight || thumbsOnLeft) ? "w-full flex-1" : "w-full")}>
          <div
            className="group relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-[1.75rem] border border-border shadow-[0_40px_80px_-60px_rgba(13,13,13,0.45)] outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            tabIndex={0}
            style={{ maxHeight, touchAction: "pan-y", backgroundColor: showFallback ? undefined : imageBackgrounds[current?.resolvedSrc || ''] || '#ffffff' }}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") goPrev()
              if (e.key === "ArrowRight") goNext()
            }}
            aria-label="Galerie produit"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onPointerLeave={onPointerEnd}
            onClick={() => {
              if (swipeRef.current.blockNextClick) {
                swipeRef.current.blockNextClick = false
                return
              }
              if (current) onMainClick ? onMainClick(current, selectedIndex) : goNext()
            }}
          >
            {!showFallback && current ? (
              <Image
                key={current.resolvedSrc}
                src={current.resolvedSrc!}
                alt={altText}
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-contain p-6 transition-transform duration-[1600ms] ease-[var(--ease-slow)] group-hover:scale-[1.08] sm:p-10"
                onLoad={(event) => detectBackground(current.resolvedSrc!, event.currentTarget)}
                priority
                onError={() => markBroken(current.id)}
              />
            ) : (
              <div className="absolute inset-0 transition-transform duration-[1600ms] ease-[var(--ease-slow)] group-hover:scale-[1.05]">{fallback("lg")}</div>
            )}

            {/* slow light sweep */}
            <span className="pointer-events-none absolute inset-y-0 -start-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 transition-[inset-inline-start,opacity] duration-[1800ms] ease-[var(--ease-slow)] group-hover:start-[120%] group-hover:opacity-100" aria-hidden="true" />

            {promoPercent && promoPercent > 0 ? (
              <span className="absolute start-4 top-4 inline-flex items-center rounded-full bg-gold px-3 py-1.5 text-sm font-extrabold text-ink shadow-[0_10px_24px_-10px_rgba(242,159,4,0.8)]">
                -{promoPercent}%
              </span>
            ) : null}

            {images.length > 1 && (
              <>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="pointer-events-auto size-11 rounded-full border border-white/20 bg-ink/55 text-white backdrop-blur-md transition-[opacity,transform,background-color] duration-700 ease-[var(--ease-slow)] hover:bg-ink/80 hover:text-white [@media(hover:hover)]:-translate-x-2 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-x-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-visible:opacity-100"
                    aria-label="Image précédente"
                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  >
                    <ChevronLeft className="size-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="pointer-events-auto size-11 rounded-full border border-white/20 bg-ink/55 text-white backdrop-blur-md transition-[opacity,transform,background-color] duration-700 ease-[var(--ease-slow)] hover:bg-ink/80 hover:text-white [@media(hover:hover)]:translate-x-2 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-x-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-visible:opacity-100"
                    aria-label="Image suivante"
                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                  >
                    <ChevronRight className="size-5" />
                  </Button>
                </div>
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink/55 px-2.5 py-1.5 backdrop-blur-md">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      aria-hidden="true"
                      className={cn("h-1.5 rounded-full transition-all duration-700 ease-[var(--ease-slow)]", i === selectedIndex ? "w-5 bg-brand-yellow" : "w-1.5 bg-white/45")}
                    />
                  ))}
                </div>
                {showIndex && (
                  <div className="absolute end-4 top-4 rounded-full bg-ink/55 px-2.5 py-1 text-xs font-semibold tabular text-white backdrop-blur-md">
                    {selectedIndex + 1}/{images.length}
                  </div>
                )}
              </>
            )}
          </div>

          {mobileThumbs}
        </div>

        {images.length > 1 && !thumbsOnLeft && (
          thumbsOnRight ? (
            <div className="hidden md:block">{verticalThumbs}</div>
          ) : (
            <div className="hidden gap-2.5 md:flex md:flex-wrap">
              {resolvedImages.map((image, index) => thumb(image, index))}
            </div>
          )
        )}
      </div>
    </div>
  )
}

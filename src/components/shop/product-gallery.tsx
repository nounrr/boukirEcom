"use client"

import { useCallback, useMemo, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toAbsoluteImageUrl } from "@/lib/image-url"
import { ChevronLeft, ChevronRight, Package } from "lucide-react"

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
}: ProductGalleryProps) {
  const [brokenIds, setBrokenIds] = useState<Set<number>>(() => new Set())

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

  const verticalThumbs = (
    images.length > 1 && (
      <div
        className="flex flex-col gap-2"
        style={{ maxHeight: maxHeight, overflowY: "auto" }}
      >
        {resolvedImages.map((image, index) => (
          <button
            key={image.id}
            onClick={() => onSelectedChange(index)}
            className={cn(
              "relative rounded-md overflow-hidden bg-muted border transition-all cursor-pointer",
              selectedIndex === index
                ? "border-primary border-2 ring-1 ring-primary/20"
                : "border-border hover:border-primary/50"
            )}
            style={{ width: thumbSize, height: thumbSize }}
          >
            {image.resolvedSrc && !brokenIds.has(image.id) ? (
              <Image
                src={image.resolvedSrc}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover"
                onError={() => markBroken(image.id)}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <Package className="h-5 w-5 text-muted-foreground/40" />
              </div>
            )}
          </button>
        ))}
      </div>
    )
  )

  return (
    <div className={cn("sticky top-2 w-full", className)}>
      <div className={cn((thumbsOnRight || thumbsOnLeft) ? "flex items-start gap-2" : "space-y-2")}>
        {thumbsOnLeft && verticalThumbs}
        <div
          className="relative aspect-square rounded-md overflow-hidden bg-muted border border-border/40 group cursor-pointer flex-1"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") goPrev()
            if (e.key === "ArrowRight") goNext()
          }}
          aria-label="Galerie produit"
          style={{ maxHeight: maxHeight }}
          onClick={() => {
            if (current) {
              onMainClick ? onMainClick(current, selectedIndex) : goNext()
            }
          }}
        >
          {current?.resolvedSrc && !brokenIds.has(current.id) ? (
          <Image
              src={current.resolvedSrc}
              alt={altText}
            fill
            className="object-cover"
            priority
              onError={() => markBroken(current.id)}
          />
        ) : (
              <div className="absolute inset-0 grid place-items-center">
                <Package className="h-14 w-14 text-muted-foreground/25" />
          </div>
        )}

        {promoPercent && promoPercent > 0 && (
          <Badge className="absolute top-3 left-3 bg-red-500 hover:bg-red-500 text-white px-2 py-0.5 text-xs font-semibold">
            -{promoPercent}%
          </Badge>
        )}

        {images.length > 1 && (
          <>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                  className="pointer-events-auto h-8 w-8 rounded-full bg-background/60 hover:bg-background/80 border border-border/40 shadow-sm"
                aria-label="Image précédente"
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                  className="pointer-events-auto h-8 w-8 rounded-full bg-background/60 hover:bg-background/80 border border-border/40 shadow-sm"
                aria-label="Image suivante"
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background/60 px-1.5 py-0.5 rounded-full border border-border/40 shadow-sm">
              {images.map((_, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    i === selectedIndex ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
              {showIndex && (
                <div className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded-full bg-background/70 border border-border/40 text-muted-foreground">
                  {selectedIndex + 1}/{images.length}
                </div>
              )}
          </>
        )}
        </div>

        {images.length > 1 && !thumbsOnLeft && (
          thumbsOnRight ? (
            verticalThumbs
          ) : (
            <div className="flex flex-wrap gap-1">
                {resolvedImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => onSelectedChange(index)}
                  className={cn(
                    "relative rounded-md overflow-hidden bg-muted border transition-all cursor-pointer",
                    selectedIndex === index
                      ? "border-primary border-2 ring-1 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  )}
                  style={{ width: thumbSize, height: thumbSize }}
                >
                  {image.resolvedSrc && !brokenIds.has(image.id) ? (
                    <Image
                      src={image.resolvedSrc}
                      alt={`Image ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={() => markBroken(image.id)}
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center">
                      <Package className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}
                </button>
              ))}
              </div>
            )
        )}
      </div>
    </div>
  )
}

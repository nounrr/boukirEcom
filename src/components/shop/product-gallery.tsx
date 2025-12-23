"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface GalleryImage { id: number; image_url: string }

interface ProductGalleryProps {
  images: GalleryImage[]
  selectedIndex: number
  onSelectedChange: (index: number) => void
  className?: string
  promoPercent?: number | null
  maxHeight?: number
}

export function ProductGallery({
  images,
  selectedIndex,
  onSelectedChange,
  className,
  promoPercent,
  maxHeight = 520,
}: ProductGalleryProps) {
  const hasImages = Array.isArray(images) && images.length > 0
  const current = hasImages ? images[Math.max(0, Math.min(selectedIndex, images.length - 1))] : undefined

  const goPrev = () => onSelectedChange((selectedIndex - 1 + images.length) % images.length)
  const goNext = () => onSelectedChange((selectedIndex + 1) % images.length)

  return (
    <div className={cn("sticky top-4 space-y-3", className)}>
      <div
        className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border/40 group"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") goPrev()
          if (e.key === "ArrowRight") goNext()
        }}
        aria-label="Galerie produit"
        style={{ maxHeight: maxHeight }}
      >
        {current?.image_url ? (
          <Image
            src={current.image_url}
            alt="Product image"
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* fallback is handled by parent */}
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
                className="pointer-events-auto h-9 w-9 rounded-full bg-background/60 hover:bg-background/80 border border-border/40 shadow-sm"
                aria-label="Image précédente"
                onClick={goPrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="pointer-events-auto h-9 w-9 rounded-full bg-background/60 hover:bg-background/80 border border-border/40 shadow-sm"
                aria-label="Image suivante"
                onClick={goNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-background/60 px-2 py-1 rounded-full border border-border/40 shadow-sm">
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
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => onSelectedChange(index)}
              className={cn(
                "relative aspect-square rounded-md overflow-hidden bg-muted border transition-all",
                selectedIndex === index
                  ? "border-primary border-2 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Image src={image.image_url} alt={`Image ${index + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import Link from "next/link"
import { Camera, Loader2, ScanSearch, Search, Sparkles } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"

import { optimizedImageProps } from "@/lib/image-optimize"
import { toAbsoluteImageUrl } from "@/lib/image-url"
import { getLocalizedProductName } from "@/lib/localized-fields"
import { productHref } from "@/lib/seo/product-url"
import { cn } from "@/lib/utils"
import { cropImage, lensObjects, visualMatches, type LensObject } from "@/lib/visual-search"
import type { ProductListItem } from "@/types/api/products"

type Box = [number, number, number, number]

/**
 * Google Lens-style results: the customer's photo with a box on each product found in it (tap one
 * to search only that object, or draw your own box), words to refine (« en rouge », « 180 mm »),
 * the text read on each object, and the most similar catalogue products below.
 */
export function LensResults({
  photo,
  initialProducts,
  onByName,
  onSearchText,
  onNewPhoto,
  onOpenProduct,
}: {
  photo: string
  initialProducts: ProductListItem[]
  onByName: (image: string) => void
  onSearchText: (text: string) => void
  onNewPhoto: () => void
  onOpenProduct: () => void
}) {
  const t = useTranslations("headerSearch")
  const locale = useLocale()
  const [products, setProducts] = useState(initialProducts)
  const [objects, setObjects] = useState<LensObject[] | null>(null)
  const [selected, setSelected] = useState<number | "custom" | null>(null)
  const [customBox, setCustomBox] = useState<Box | null>(null)
  const [words, setWords] = useState("")
  const [searching, setSearching] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const drawStart = useRef<{ x: number; y: number } | null>(null)
  const [drawing, setDrawing] = useState<Box | null>(null)

  // Objects in the photo, found while the first results are already shown.
  useEffect(() => {
    let alive = true
    lensObjects(photo).then((found) => { if (alive) setObjects(found) }).catch(() => { if (alive) setObjects([]) })
    return () => { alive = false }
  }, [photo])

  const currentBox = (): Box | null => (selected === "custom" ? customBox : typeof selected === "number" ? objects?.[selected]?.box ?? null : null)

  const run = async (box: Box | null, text: string) => {
    setSearching(true)
    try {
      const image = box ? await cropImage(photo, box) : photo
      const found = await visualMatches(image, text)
      setProducts(found)
    } catch {
      setProducts([])
    } finally {
      setSearching(false)
    }
  }

  const pick = (index: number | null) => {
    setSelected(index)
    setCustomBox(null)
    void run(index === null ? null : objects?.[index]?.box ?? null, words)
  }

  // Draw a box on the photo (mouse or finger), like Lens's crop handles.
  const point = (event: ReactPointerEvent) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: Math.max(0, Math.min(1000, ((event.clientX - rect.left) / rect.width) * 1000)),
      y: Math.max(0, Math.min(1000, ((event.clientY - rect.top) / rect.height) * 1000)),
    }
  }
  const toBox = (a: { x: number; y: number }, b: { x: number; y: number }): Box => [Math.min(a.y, b.y), Math.min(a.x, b.x), Math.max(a.y, b.y), Math.max(a.x, b.x)]

  const style = (box: Box) => ({ top: `${box[0] / 10}%`, left: `${box[1] / 10}%`, height: `${(box[2] - box[0]) / 10}%`, width: `${(box[3] - box[1]) / 10}%` })
  const shown = objects ?? []

  return (
    <div className="grid gap-4">
      {/* Photo with the objects found (tap) and the box being drawn (drag). */}
      <div
        ref={stageRef}
        className="relative mx-auto w-fit max-w-full touch-none select-none overflow-hidden rounded-2xl border border-border bg-muted"
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("button")) return
          drawStart.current = point(event)
          ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          if (drawStart.current) setDrawing(toBox(drawStart.current, point(event)))
        }}
        onPointerUp={(event) => {
          const start = drawStart.current
          drawStart.current = null
          setDrawing(null)
          if (!start) return
          const box = toBox(start, point(event))
          if (box[2] - box[0] < 40 || box[3] - box[1] < 40) return // a tap, not a box
          setSelected("custom")
          setCustomBox(box)
          void run(box, words)
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- the customer's own photo (data URL) */}
        <img src={photo} alt="" draggable={false} className="block max-h-[260px] w-auto max-w-full" />
        {shown.map((object, index) => (
          <button
            key={index}
            type="button"
            onClick={() => pick(selected === index ? null : index)}
            aria-pressed={selected === index}
            aria-label={[object.label, object.text].filter(Boolean).join(" · ")}
            title={[object.label, object.text].filter(Boolean).join(" · ")}
            style={style(object.box)}
            className={cn(
              "absolute rounded-xl border-2 transition-[border-color,background-color,box-shadow] duration-300",
              selected === index ? "border-brand-yellow bg-brand-yellow/15 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" : "border-white/90 bg-white/5 shadow-[0_0_0_1px_rgba(0,0,0,0.35)] hover:border-brand-yellow"
            )}
          />
        ))}
        {selected === "custom" && customBox ? (
          <span className="pointer-events-none absolute rounded-xl border-2 border-brand-yellow bg-brand-yellow/15 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" style={style(customBox)} />
        ) : null}
        {drawing ? <span className="pointer-events-none absolute rounded-xl border-2 border-dashed border-brand-yellow" style={style(drawing)} /> : null}
        {objects === null ? (
          <span className="absolute bottom-2 start-2 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
            {t("lensDetecting")}
          </span>
        ) : null}
      </div>
      <p className="-mt-2 text-center text-xs text-muted-foreground">{t("lensDraw")}</p>

      {/* Objects as chips: name and the text read on them (brand, reference). */}
      {shown.length > 0 || selected !== null ? (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => pick(null)}
            aria-pressed={selected === null}
            className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors", selected === null ? "border-primary bg-primary text-white" : "border-border hover:border-primary/50")}
          >
            <ScanSearch className="size-3.5" aria-hidden="true" />
            {t("lensWhole")}
          </button>
          {shown.map((object, index) => (
            <button
              key={index}
              type="button"
              onClick={() => pick(index)}
              aria-pressed={selected === index}
              className={cn("inline-flex h-8 max-w-full items-center gap-1 rounded-full border px-3 text-xs font-semibold transition-colors", selected === index ? "border-primary bg-primary text-white" : "border-border hover:border-primary/50")}
            >
              <span className="truncate">{object.label}</span>
              {object.text ? <span className={cn("truncate font-bold", selected === index ? "text-white/85" : "text-accent-text")}>· {object.text}</span> : null}
            </button>
          ))}
        </div>
      ) : null}

      {/* Photo + words (multisearch). */}
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          void run(currentBox(), words)
        }}
      >
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{t("lensWords")}</span>
          <Sparkles className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-accent-text" aria-hidden="true" />
          <input
            value={words}
            onChange={(event) => setWords(event.target.value)}
            maxLength={100}
            placeholder={t("lensWords")}
            className="h-10 w-full rounded-full border border-border bg-background ps-9 pe-3 text-sm outline-none transition-colors focus:border-primary/60"
          />
        </label>
        <button type="submit" disabled={searching} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-gold px-4 text-sm font-bold text-ink disabled:opacity-60">
          {searching ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
          {t("lensApply")}
        </button>
      </form>

      {/* Most similar products. */}
      <div className="relative">
        {searching ? <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-background/60 backdrop-blur-[1px]"><Loader2 className="size-6 animate-spin text-accent-text" aria-hidden="true" /></div> : null}
        {products.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{t("lensNoMatch")}</p>
        ) : (
          <ul className="grid max-h-[40vh] grid-cols-2 gap-2.5 overflow-y-auto pe-1 sm:grid-cols-3">
            {products.map((product) => {
              const src = toAbsoluteImageUrl(product.image_url)
              const name = getLocalizedProductName(product as never, locale) || product.designation
              const price = Number(product.prix_promo || product.prix_vente) || 0
              return (
                <li key={product.id}>
                  <Link
                    href={productHref(product, locale)}
                    onClick={onOpenProduct}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-[border-color,box-shadow] duration-300 hover:border-primary/50 hover:shadow-[0_14px_30px_-22px_rgba(13,13,13,0.6)]"
                  >
                    <span className="grid aspect-square place-items-center bg-white">
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element -- catalogue photos served by the API
                        <img {...optimizedImageProps(src, 160)} alt="" loading="lazy" decoding="async" className="size-full object-contain p-2 transition-transform duration-500 group-hover:scale-105" />
                      ) : null}
                    </span>
                    <span className="flex flex-1 flex-col gap-1 p-2.5">
                      <span className="line-clamp-2 text-xs font-semibold leading-snug group-hover:text-accent-text">{name}</span>
                      {price > 0 ? (
                        <span className="mt-auto text-sm font-extrabold tabular-nums">
                          {price.toLocaleString(locale === "ar" ? "ar-MA" : "fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                          <span className="text-[10px] font-bold text-accent-text">MAD</span>
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            // A selected object already has its name (and the text read on it): search that directly.
            const object = typeof selected === "number" ? objects?.[selected] : null
            if (object) onSearchText([object.label, object.text].filter(Boolean).join(" "))
            else onByName(photo)
          }}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-semibold transition-colors hover:border-primary/50"
        >
          <Search className="size-4" aria-hidden="true" />
          {t("byName")}
        </button>
        <button
          type="button"
          onClick={onNewPhoto}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gold px-4 text-sm font-bold text-ink transition-transform hover:-translate-y-0.5"
        >
          <Camera className="size-4" aria-hidden="true" />
          {t("newPhoto")}
        </button>
      </div>
    </div>
  )
}

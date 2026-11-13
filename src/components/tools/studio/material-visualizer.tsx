"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useId, useState } from "react"
import { cn } from "@/lib/utils"

type FloorSwatch = { key: string; image: string; search: string }
type WallSwatch = { key: string; color: string }

const FLOORS: FloorSwatch[] = [
  { key: "tile", image: "/product-fallbacks/tile.webp", search: "carrelage" },
  { key: "stone", image: "/product-fallbacks/mineral.webp", search: "enduit" },
  { key: "wood", image: "/product-fallbacks/wood.webp", search: "bois" },
  { key: "metal", image: "/product-fallbacks/metal.webp", search: "profil" },
]
const WALLS: WallSwatch[] = [
  { key: "paintWhite", color: "#ECE8DF" },
  { key: "paintSand", color: "#D8C3A0" },
  { key: "paintOchre", color: "#C98A2B" },
  { key: "paintGraphite", color: "#4D4D4D" },
]

/**
 * Isometric sample room. Floor swatches are real photographic textures from
 * the site's assets; wall colours are illustrative. Nothing here selects a
 * product — it only links to the relevant catalogue search.
 */
export function MaterialVisualizer() {
  const t = useTranslations("xp.studio.materials")
  const locale = useLocale()
  const uid = useId().replace(/:/g, "")
  const [floor, setFloor] = useState(FLOORS[0])
  const [wall, setWall] = useState(WALLS[1])
  const [split, setSplit] = useState(55)

  // Isometric room geometry (viewBox 800×560)
  const floorPts = "400,500 760,320 400,140 40,320"
  const leftWall = "40,320 400,140 400,-20 40,160"
  const rightWall = "400,140 760,320 760,160 400,-20"

  const Room = ({ after }: { after: boolean }) => (
    <g>
      <polygon points={leftWall} fill={after ? wall.color : "#8f8f8f"} />
      <polygon points={leftWall} fill="url(#shadeL)" />
      <polygon points={rightWall} fill={after ? wall.color : "#a3a3a3"} />
      <polygon points={rightWall} fill="url(#shadeR)" />
      <polygon points={floorPts} fill={after ? `url(#floor-${uid})` : "#6f6f6f"} />
      {!after ? <polygon points={floorPts} fill={`url(#hatch-${uid})`} /> : null}
      <polygon points={floorPts} fill="url(#floorShade)" />
      {/* window & door for scale */}
      <polygon points="140,230 260,170 260,90 140,150" fill={after ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.25)"} stroke="rgba(13,13,13,0.25)" />
      <polygon points="520,214 600,254 600,130 520,90" fill="rgba(13,13,13,0.22)" stroke="rgba(13,13,13,0.3)" />
      <path d="M400 140V-20" stroke="rgba(13,13,13,0.18)" />
    </g>
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="relative">
          <svg style={{ direction: "ltr", unicodeBidi: "isolate" }} viewBox="-10 -40 820 560" className="h-auto w-full" role="img" aria-label={`${t(`swatches.${floor.key}`)} · ${t(`swatches.${wall.key}`)}`}>
            <defs>
              <pattern id={`floor-${uid}`} patternUnits="userSpaceOnUse" width="180" height="180" patternTransform="matrix(0.894 -0.447 0.894 0.447 0 0)">
                <image href={floor.image} width="180" height="180" preserveAspectRatio="xMidYMid slice" />
              </pattern>
              <pattern id={`hatch-${uid}`} patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                <path d="M0 0V10" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
              </pattern>
              <linearGradient id="shadeL" x1="0" x2="1">
                <stop offset="0" stopColor="#000" stopOpacity="0.28" />
                <stop offset="1" stopColor="#000" stopOpacity="0.06" />
              </linearGradient>
              <linearGradient id="shadeR" x1="0" x2="1">
                <stop offset="0" stopColor="#000" stopOpacity="0" />
                <stop offset="1" stopColor="#000" stopOpacity="0.18" />
              </linearGradient>
              <linearGradient id="floorShade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#000" stopOpacity="0.25" />
                <stop offset="1" stopColor="#000" stopOpacity="0" />
              </linearGradient>
              <clipPath id={`after-${uid}`}>
                <rect x="-10" y="-40" width={(820 * split) / 100} height="560" />
              </clipPath>
            </defs>
            <Room after={false} />
            <g clipPath={`url(#after-${uid})`}>
              <Room after />
            </g>
            <line x1={-10 + (820 * split) / 100} x2={-10 + (820 * split) / 100} y1="-40" y2="520" stroke="#f29f04" strokeWidth="2" />
          </svg>
          <span className="absolute start-4 top-4 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-white">{t("after")}</span>
          <span className="absolute end-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold">{t("before")}</span>
        </div>
        <div className="border-t border-border p-4">
          <label className="block text-xs font-medium text-muted-foreground">
            {t("compare")}
            <input type="range" min={0} max={100} value={split} onChange={(e) => setSplit(Number(e.target.value))} className="mt-2 w-full accent-[var(--primary)]" />
          </label>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{t("illustrative")}</p>
        </div>
      </div>

      <div className="space-y-6">
        <p className="text-sm leading-relaxed text-muted-foreground">{t("intro")}</p>
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">{t("floor")}</legend>
          <div className="grid grid-cols-4 gap-2">
            {FLOORS.map((swatch) => (
              <button
                key={swatch.key}
                type="button"
                aria-pressed={floor.key === swatch.key}
                onClick={() => setFloor(swatch)}
                className={cn("group overflow-hidden rounded-2xl border-2 text-start transition-colors", floor.key === swatch.key ? "border-primary" : "border-transparent hover:border-border")}
              >
                <span className="block aspect-square bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${swatch.image})` }} />
                <span className="block truncate px-1.5 py-1.5 text-[11px] font-medium">{t(`swatches.${swatch.key}`)}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">{t("wall")}</legend>
          <div className="grid grid-cols-4 gap-2">
            {WALLS.map((swatch) => (
              <button
                key={swatch.key}
                type="button"
                aria-pressed={wall.key === swatch.key}
                onClick={() => setWall(swatch)}
                className={cn("rounded-2xl border-2 p-1.5 text-start transition-colors", wall.key === swatch.key ? "border-primary" : "border-transparent hover:border-border")}
              >
                <span className="block aspect-square rounded-xl border border-black/10" style={{ background: swatch.color }} />
                <span className="mt-1.5 block truncate text-[11px] font-medium">{t(`swatches.${swatch.key}`)}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${locale}/shop?search=${encodeURIComponent(floor.search)}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium hover:border-primary">
            {t(`swatches.${floor.key}`)}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
          <Link href={`/${locale}/shop?search=peinture`} className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium hover:border-primary">
            {t("browse")}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  )
}

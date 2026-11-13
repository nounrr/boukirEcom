"use client"

import { ArrowRight } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import { useId, useMemo, useState } from "react"
import { parseDecimal, round } from "@/lib/calculators/core"
import { calcConcrete, calcPaint, calcTiles, calcWaterproofing } from "@/lib/calculators/formulas"
import { AnimatedNumber } from "@/components/motion/primitives"
import { cn } from "@/lib/utils"

type Material = "carrelage" | "peinture" | "beton" | "etancheite"

/**
 * « Besoin d'une estimation rapide ? » — a deliberately small teaser.
 * Uses the same pure formulas and the same dimension mapping as the link it
 * opens, so the preview and the full tool always agree.
 */
export function FooterEstimator() {
  const t = useTranslations("xp.footer.estimator")
  const tu = useTranslations("xp.units")
  const locale = useLocale()
  const id = useId()
  const [areaRaw, setAreaRaw] = useState("24")
  const [material, setMaterial] = useState<Material>("carrelage")

  const preview = useMemo(() => {
    const area = parseDecimal(areaRaw)
    if (area === null || area <= 0 || area > 100_000) return null
    const side = round(Math.sqrt(area), 2)
    if (material === "carrelage") {
      const r = calcTiles({ lengthM: 0, widthM: 0, extraAreaM2: area, tileLengthCm: 60, tileWidthCm: 60, packMode: "area", m2PerBox: 1.44, wastePct: 10 })
      return r.ok ? { value: r.value.boxes ?? 0, decimals: 0, unit: tu("boxes"), note: t("noteTiles"), href: `carrelage?area=${area}` } : null
    }
    if (material === "peinture") {
      const length = round(area / 2.7, 2)
      const r = calcPaint({ mode: "wall", lengthM: length, heightM: 2.7, doors: 0, windows: 0, coats: 2, coverageM2PerL: 10, wastePct: 5, containerL: 15 })
      return r.ok ? { value: r.value.liters, decimals: 1, unit: "L", note: t("notePaint"), href: `peinture?mode=wall&lengthM=${length}&heightM=2.7&doors=0&windows=0` } : null
    }
    if (material === "beton") {
      const r = calcConcrete({ shape: "rect", lengthM: side, widthM: side, thicknessCm: 12, wastePct: 5, dosageKgPerM3: 350, bagKg: 50 })
      return r.ok ? { value: r.value.bags, decimals: 0, unit: tu("bags"), note: t("noteConcrete"), href: `beton?lengthM=${side}&widthM=${side}&thicknessCm=12` } : null
    }
    const r = calcWaterproofing({ mode: "liquid", lengthM: side, widthM: side, upstandCm: 0, coats: 2, consumptionKgPerM2: 1.5, packKg: 20, wastePct: 5 })
    return r.ok ? { value: r.value.packs, decimals: 0, unit: tu("packs"), note: t("noteWaterproofing"), href: `etancheite?lengthM=${side}&widthM=${side}&upstandCm=0` } : null
  }, [areaRaw, material, t, tu])

  const options: Material[] = ["carrelage", "peinture", "beton", "etancheite"]

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md sm:p-6">
      <div className="pointer-events-none absolute -end-16 -top-16 size-48 rounded-full bg-brand-orange/20 blur-3xl" aria-hidden="true" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-yellow">{t("kicker")}</p>
      <h3 className="mt-2 text-lg font-bold text-white">{t("title")}</h3>

      <div className="mt-4 flex flex-wrap gap-1.5" role="radiogroup" aria-label={t("materialLabel")}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={material === option}
            onClick={() => setMaterial(option)}
            className={cn(
              "h-8 rounded-full border px-3 text-xs font-semibold transition-colors",
              material === option ? "border-brand-orange bg-brand-orange text-ink" : "border-white/15 text-white/75 hover:border-white/30 hover:text-white"
            )}
          >
            {t(`materials.${option}`)}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-3">
        <label htmlFor={`${id}-area`} className="block">
          <span className="text-xs font-medium text-white/60">{t("areaLabel")}</span>
          <span className="mt-1.5 flex h-12 items-center rounded-xl border border-white/15 bg-black/30 px-3.5 focus-within:border-brand-orange">
            <input
              id={`${id}-area`}
              inputMode="decimal"
              value={areaRaw}
              onChange={(e) => setAreaRaw(e.target.value)}
              className="w-full bg-transparent text-lg font-semibold text-white tabular outline-none placeholder:text-white/30"
              placeholder="24"
              aria-describedby={`${id}-note`}
            />
            <span className="text-sm text-white/50">m²</span>
          </span>
        </label>
        <div className="min-w-[7.5rem] text-end" aria-live="polite">
          <p className="text-xs text-white/55">{t("result")}</p>
          <p className="mt-1 text-3xl font-extrabold text-white">
            {preview ? <AnimatedNumber value={preview.value} decimals={preview.decimals} locale={locale} /> : "—"}
            <span className="ms-1.5 text-sm font-semibold text-brand-yellow">{preview?.unit}</span>
          </p>
        </div>
      </div>

      <p id={`${id}-note`} className="mt-3 text-[11px] leading-relaxed text-white/50">
        {preview ? preview.note : t("invalid")} · {t("indicative")}
      </p>

      <Link
        href={`/${locale}/calculateurs/${preview?.href ?? material}`}
        className="group mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-yellow hover:text-white"
      >
        {t("openFull")}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" aria-hidden="true" />
      </Link>
    </div>
  )
}

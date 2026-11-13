"use client"

import Link from "next/link"
import { ArrowRight, Calculator, Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"

import { AnimatedNumber, formatNumber } from "@/components/motion/primitives"
import { ChoiceField, NumberField, toInput } from "@/components/tools/fields"
import { RoomPlan } from "@/components/tools/diagrams/room-plan"
import { SlabIso, WallElevation } from "@/components/tools/diagrams/other-diagrams"
import { catalogHref } from "@/lib/catalog/registry"
import { parseDecimal } from "@/lib/calculators/core"
import { calcConcrete, calcPaint, calcTiles, calcWaterproofing } from "@/lib/calculators/formulas"
import { cn } from "@/lib/utils"
import { SectionHeading } from "./section-heading"

type Tab = "carrelage" | "peinture" | "beton" | "etancheite"

const CATALOG: Record<Tab, number> = { carrelage: 50, peinture: 72, beton: 73, etancheite: 75 }
const FORMATS = ["30x30", "60x60", "60x120"] as const

/**
 * Scene 04 — Live measurement. A genuinely working mini-simulator: the
 * diagram, inputs and results share one state; numbers come from the same
 * pure formulas as the full calculators. Only the presentation animates.
 */
export function FlagshipShowcase({ locale }: { locale: string }) {
  const t = useTranslations("xp.home.showcase")
  const td = useTranslations("xp.tools.diagram")
  const tu = useTranslations("xp.units")
  const tr = useTranslations("xp.results")
  const [tab, setTab] = useState<Tab>("carrelage")
  const [lengthRaw, setLength] = useState(toInput(4.6, locale))
  const [widthRaw, setWidth] = useState(toInput(3.8, locale))
  const [heightRaw, setHeight] = useState(toInput(2.7, locale))
  const [thicknessRaw, setThickness] = useState("12")
  const [format, setFormat] = useState<(typeof FORMATS)[number]>("60x60")

  const L = parseDecimal(lengthRaw) ?? 0
  const W = parseDecimal(widthRaw) ?? 0
  const H = parseDecimal(heightRaw) ?? 0
  const T = parseDecimal(thicknessRaw) ?? 0
  const [fl, fw] = format.split("x").map(Number)

  const out = useMemo(() => {
    if (tab === "carrelage") {
      const r = calcTiles({ lengthM: L, widthM: W, tileLengthCm: fw === 120 ? 120 : fl, tileWidthCm: fw === 120 ? 60 : fw, packMode: "area", m2PerBox: 1.44, wastePct: 10 })
      return r.ok ? { primary: r.value.boxes ?? 0, unit: tu("boxes"), label: tr("boxes"), d: 0, a: [tr("netArea"), `${formatNumber(r.value.netArea, locale, 2)} m²`], b: [tr("tiles"), `${formatNumber(r.value.tiles, locale)} ${tu("tiles")}`] } : null
    }
    if (tab === "peinture") {
      const r = calcPaint({ mode: "room", lengthM: L, widthM: W, heightM: H, doors: 1, windows: 1, coats: 2, coverageM2PerL: 10, wastePct: 0, containerL: 15 })
      return r.ok ? { primary: r.value.liters, unit: "L", label: tr("liters"), d: 1, a: [tr("paintableArea"), `${formatNumber(r.value.paintableArea, locale, 2)} m²`], b: [tr("containers"), `${r.value.containers} × 15 L`] } : null
    }
    if (tab === "beton") {
      const r = calcConcrete({ shape: "rect", lengthM: L, widthM: W, thicknessCm: T, wastePct: 5, dosageKgPerM3: 350, bagKg: 50 })
      return r.ok ? { primary: r.value.bags, unit: tu("bags"), label: tr("cementBags"), d: 0, a: [tr("adjustedVolume"), `${formatNumber(r.value.adjustedVolume, locale, 2)} m³`], b: [tr("cementKg"), `${formatNumber(r.value.cementKg, locale, 0)} kg`] } : null
    }
    const r = calcWaterproofing({ mode: "liquid", lengthM: L, widthM: W, upstandCm: 15, coats: 2, consumptionKgPerM2: 1.5, packKg: 20, wastePct: 5 })
    return r.ok ? { primary: r.value.packs, unit: tu("packs"), label: tr("packs"), d: 0, a: [tr("totalArea"), `${formatNumber(r.value.totalArea, locale, 2)} m²`], b: [tr("materialKg"), `${formatNumber(r.value.materialKg ?? 0, locale, 0)} kg`] } : null
  }, [tab, L, W, H, T, fl, fw, locale, tu, tr])

  const fullHref = useMemo(() => {
    const q = new URLSearchParams({ lengthM: String(L), widthM: String(W) })
    if (tab === "carrelage") q.set("format", format === "60x120" ? "60x120" : format)
    if (tab === "peinture") q.set("heightM", String(H))
    if (tab === "beton") q.set("thicknessCm", String(T))
    return `/${locale}/calculateurs/${tab}?${q.toString()}`
  }, [tab, L, W, H, T, format, locale])

  const diagram =
    tab === "carrelage" ? (
      <RoomPlan
        length={L}
        width={W}
        tileL={fw === 120 ? 120 : fl}
        tileW={fw === 120 ? 60 : fw}
        locale={locale}
        maxM={20}
        labels={{ length: td("length"), width: td("width"), area: td("area"), handle: td("handle") }}
        onResize={(next) => {
          if (next.length !== undefined) setLength(toInput(next.length, locale))
          if (next.width !== undefined) setWidth(toInput(next.width, locale))
        }}
      />
    ) : tab === "peinture" ? (
      <WallElevation length={2 * (L + W)} height={H} doors={1} windows={1} developed locale={locale} labels={{ length: td("length"), height: td("height"), developed: td("developed") }} />
    ) : (
      <SlabIso length={L} width={W} depthCm={tab === "beton" ? T : 15} variant={tab === "beton" ? "concrete" : "membrane"} locale={locale} labels={{ length: td("length"), width: td("width"), depth: td("depth") }} />
    )

  return (
    <section className="relative isolate overflow-hidden bg-ink py-20 text-white lg:py-32" aria-labelledby="showcase-title">
      <div className="bd-grid absolute inset-0 -z-10 [--grid-color:rgba(255,255,255,0.04)]" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_60%_at_85%_10%,rgba(242,183,5,0.16),transparent_70%)]" aria-hidden="true" />
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <SectionHeading tone="dark" id="showcase-title" kicker={t("kicker")} title={t("title")} description={t("desc")} />

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          {/* Diagram stage */}
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-background text-foreground shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)]" data-reveal="scale">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-accent-text">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full rounded-full bg-primary opacity-60 motion-safe:animate-ping" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                {t("live")}
              </span>
              <span className="hidden text-xs text-muted-foreground sm:block">{tab === "carrelage" ? t("dragHint") : t(`notes.${tab}`, { format: format.replace("x", "×") })}</span>
            </div>
            <div className="p-3 sm:p-6">{diagram}</div>
          </div>

          {/* Controls & live results */}
          <div className="flex flex-col rounded-[2rem] border border-white/10 bg-background p-5 text-foreground sm:p-7" data-reveal="scale" style={{ ["--reveal-delay" as string]: "150ms" }}>
            <div role="tablist" aria-label={t("kicker")} className="grid grid-cols-4 gap-1 rounded-2xl bg-muted p-1">
              {(["carrelage", "peinture", "beton", "etancheite"] as Tab[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={cn(
                    "h-10 rounded-xl px-1 text-[12.5px] font-semibold transition-all duration-300",
                    tab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t(`tabs.${key}`)}
                </button>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <NumberField label={t("length")} unit="m" value={lengthRaw} onChange={setLength} step={0.1} locale={locale} />
              <NumberField label={t("width")} unit="m" value={widthRaw} onChange={setWidth} step={0.1} locale={locale} />
              {tab === "peinture" ? <NumberField label={t("height")} unit="m" value={heightRaw} onChange={setHeight} step={0.05} locale={locale} className="col-span-2" /> : null}
              {tab === "beton" ? <NumberField label={t("thickness")} unit="cm" value={thicknessRaw} onChange={setThickness} step={1} locale={locale} className="col-span-2" /> : null}
              {tab === "carrelage" ? (
                <ChoiceField className="col-span-2" label={t("tileFormat")} value={format} onChange={(v) => setFormat(v as (typeof FORMATS)[number])} options={FORMATS.map((f) => ({ value: f, label: f.replace("x", " × ") }))} />
              ) : null}
            </div>

            <div className="mt-6 flex-1 rounded-2xl bg-ink p-6 text-white" aria-live="polite">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-yellow">{out?.label ?? "—"}</p>
              <p className="mt-2 flex items-baseline gap-2.5">
                {out ? <AnimatedNumber key={tab} value={out.primary} decimals={out.d} locale={locale} fromZeroOnView className="text-6xl font-extrabold tracking-tight" /> : <span className="text-6xl font-extrabold">—</span>}
                <span className="text-lg font-semibold text-brand-yellow">{out?.unit}</span>
              </p>
              {out ? (
                <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-sm">
                  {[out.a, out.b].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-white/50">{label}</dt>
                      <dd className="mt-1 font-semibold tabular">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              <p className="mt-4 flex gap-2 text-[11px] leading-relaxed text-white/45">
                <Sparkles className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                {t(`notes.${tab}`, { format: format.replace("x", "×") })}
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <Link href={fullHref} className="group inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-ink">
                <Calculator className="size-4" aria-hidden="true" />
                {t("open")}
              </Link>
              <Link href={catalogHref(locale, "categories", CATALOG[tab])} className="group inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-semibold hover:border-foreground/40">
                {t("discover")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

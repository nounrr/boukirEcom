"use client"

import Link from "next/link"
import { ArrowRight, BrickWall, Grid3x3, Home, Palette, PiggyBank } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

import { AnimatedNumber, formatNumber } from "@/components/motion/primitives"
import { BudgetEstimator } from "@/components/tools/budget-estimator"
import { ChoiceField, NumberField, toInput } from "@/components/tools/fields"
import { RoomPlan, type LayoutPattern } from "@/components/tools/diagrams/room-plan"
import { SlabIso, WallElevation } from "@/components/tools/diagrams/other-diagrams"
import { parseDecimal } from "@/lib/calculators/core"
import { calcBlocks, calcConcrete, calcLayoutCounts, calcPaint, calcTiles, TILE_PATTERN_WASTE } from "@/lib/calculators/formulas"
import { cn } from "@/lib/utils"
import { MaterialVisualizer } from "./material-visualizer"

type TabKey = "room" | "materials" | "layout" | "structure" | "budget"
const TABS: { key: TabKey; icon: typeof Home }[] = [
  { key: "room", icon: Home },
  { key: "materials", icon: Palette },
  { key: "layout", icon: Grid3x3 },
  { key: "structure", icon: BrickWall },
  { key: "budget", icon: PiggyBank },
]

function Stat({ label, value, unit, decimals = 0, locale }: { label: string; value: number | null; unit: string; decimals?: number; locale: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-extrabold">
        {value === null ? "—" : <AnimatedNumber value={value} decimals={decimals} locale={locale} />}
        <span className="ms-1.5 text-sm font-semibold text-accent-text">{unit}</span>
      </p>
    </div>
  )
}

function useNum(initial: number, locale: string) {
  const [raw, setRaw] = useState(toInput(initial, locale))
  return [raw, setRaw, parseDecimal(raw) ?? 0] as const
}

function RoomSimulator() {
  const t = useTranslations("xp.studio.room")
  const td = useTranslations("xp.tools.diagram")
  const tu = useTranslations("xp.units")
  const locale = useLocale()
  const [view, setView] = useState<"floor" | "walls">("floor")
  const [lRaw, setL, L] = useNum(4.8, locale)
  const [wRaw, setW, W] = useNum(3.6, locale)
  const [hRaw, setH, H] = useNum(2.7, locale)
  const [dRaw, setD, D] = useNum(1, locale)
  const [winRaw, setWin, Win] = useNum(1, locale)

  const tiles = calcTiles({ lengthM: L, widthM: W, tileLengthCm: 60, tileWidthCm: 60, packMode: "area", m2PerBox: 1.44, wastePct: 10 })
  const paint = calcPaint({ mode: "room", lengthM: L, widthM: W, heightM: H, doors: D, windows: Win, coats: 2, coverageM2PerL: 10, wastePct: 0, containerL: 15 })
  const q = `lengthM=${L}&widthM=${W}`

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border p-3">
          <div role="tablist" className="flex gap-1 rounded-xl bg-muted p-1">
            {(["floor", "walls"] as const).map((key) => (
              <button key={key} type="button" role="tab" aria-selected={view === key} onClick={() => setView(key)} className={cn("h-9 rounded-lg px-4 text-sm font-semibold transition-colors", view === key ? "bg-background shadow-sm" : "text-muted-foreground")}>
                {t(key)}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 sm:p-6">
          {view === "floor" ? (
            <RoomPlan
              length={L}
              width={W}
              tileL={60}
              tileW={60}
              locale={locale}
              labels={{ length: td("length"), width: td("width"), area: td("area"), handle: td("handle") }}
              onResize={(n) => {
                if (n.length !== undefined) setL(toInput(n.length, locale))
                if (n.width !== undefined) setW(toInput(n.width, locale))
              }}
            />
          ) : (
            <WallElevation length={2 * (L + W)} height={H} doors={D} windows={Win} developed locale={locale} labels={{ length: td("length"), height: td("height"), developed: td("developed") }} />
          )}
        </div>
      </div>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <NumberField label={td("length")} unit="m" value={lRaw} onChange={setL} step={0.1} locale={locale} />
          <NumberField label={td("width")} unit="m" value={wRaw} onChange={setW} step={0.1} locale={locale} />
          <NumberField label={t("height")} unit="m" value={hRaw} onChange={setH} step={0.05} locale={locale} className="col-span-2" />
          <NumberField label={t("doors")} value={dRaw} onChange={setD} step={1} locale={locale} />
          <NumberField label={t("windows")} value={winRaw} onChange={setWin} step={1} locale={locale} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat label={t("floorArea")} value={L * W} unit="m²" decimals={2} locale={locale} />
          <Stat label={t("perimeter")} value={2 * (L + W)} unit="m" decimals={2} locale={locale} />
          <Stat label={t("wallArea")} value={paint.ok ? paint.value.paintableArea : null} unit="m²" decimals={2} locale={locale} />
          <Stat label={t("tileBoxes")} value={tiles.ok ? tiles.value.boxes : null} unit={tu("boxes")} locale={locale} />
          <div className="col-span-2">
            <Stat label={t("paintLiters")} value={paint.ok ? paint.value.liters : null} unit="L" decimals={1} locale={locale} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${locale}/calculateurs/carrelage?${q}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-semibold text-background">
            {t("openTile")} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
          <Link href={`/${locale}/calculateurs/peinture?${q}&heightM=${H}&doors=${D}&windows=${Win}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold">
            {t("openPaint")} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function LayoutExplorer() {
  const t = useTranslations("xp.studio.layout")
  const td = useTranslations("xp.tools.diagram")
  const tf = useTranslations("xp.fields")
  const to = useTranslations("xp.options")
  const tu = useTranslations("xp.units")
  const tr = useTranslations("xp.results")
  const locale = useLocale()
  const [lRaw, setL, L] = useNum(4.2, locale)
  const [wRaw, setW, W] = useNum(3.4, locale)
  const [tlRaw, setTl, TL] = useNum(60, locale)
  const [twRaw, setTw, TW] = useNum(60, locale)
  const [pattern, setPattern] = useState<LayoutPattern>("straight")

  const counts = calcLayoutCounts(L, W, TL, TW, pattern)
  const tiles = calcTiles({ lengthM: L, widthM: W, tileLengthCm: TL, tileWidthCm: TW, packMode: "area", m2PerBox: 1.44, wastePct: TILE_PATTERN_WASTE[pattern] })

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-3xl border border-border bg-surface p-4 sm:p-6">
        <RoomPlan
          length={L}
          width={W}
          tileL={TL}
          tileW={TW}
          pattern={pattern}
          locale={locale}
          labels={{ length: td("length"), width: td("width"), area: td("area"), handle: td("handle") }}
          onResize={(n) => {
            if (n.length !== undefined) setL(toInput(n.length, locale))
            if (n.width !== undefined) setW(toInput(n.width, locale))
          }}
        />
        <p className="mt-3 text-xs text-muted-foreground">{t("startCorner")}</p>
      </div>
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">{t("intro")}</p>
        <div className="grid grid-cols-2 gap-4">
          <NumberField label={td("length")} unit="m" value={lRaw} onChange={setL} step={0.1} locale={locale} />
          <NumberField label={td("width")} unit="m" value={wRaw} onChange={setW} step={0.1} locale={locale} />
          <NumberField label={tf("tileLength")} unit="cm" value={tlRaw} onChange={setTl} step={5} locale={locale} />
          <NumberField label={tf("tileWidth")} unit="cm" value={twRaw} onChange={setTw} step={5} locale={locale} />
        </div>
        <ChoiceField label={tf("pattern")} value={pattern} onChange={(v) => setPattern(v as LayoutPattern)} options={(["straight", "offset", "diagonal", "herringbone"] as const).map((p) => ({ value: p, label: to(p) }))} />
        <div className="grid grid-cols-3 gap-3">
          <Stat label={t("fullTiles")} value={counts.ok ? counts.value.full : null} unit="" locale={locale} />
          <Stat label={t("cutTiles")} value={counts.ok ? counts.value.cut : null} unit="" locale={locale} />
          <Stat label={t("totalPositions")} value={counts.ok ? counts.value.positions : null} unit="" locale={locale} />
        </div>
        <Stat label={`${tr("boxes")} (${TILE_PATTERN_WASTE[pattern]} %)`} value={tiles.ok ? tiles.value.boxes : null} unit={tu("boxes")} locale={locale} />
        <p className="rounded-2xl bg-muted/60 p-4 text-xs leading-relaxed text-muted-foreground">{t("preview")}</p>
      </div>
    </div>
  )
}

function StructureVisualizers() {
  const t = useTranslations("xp.studio.structure")
  const td = useTranslations("xp.tools.diagram")
  const tu = useTranslations("xp.units")
  const tr = useTranslations("xp.results")
  const locale = useLocale()
  const [lRaw, setL, L] = useNum(5, locale)
  const [wRaw, setW, W] = useNum(4, locale)
  const [tRaw, setT, T] = useNum(12, locale)
  const [wlRaw, setWl, WL] = useNum(8, locale)
  const [whRaw, setWh, WH] = useNum(2.8, locale)
  const slab = calcConcrete({ shape: "rect", lengthM: L, widthM: W, thicknessCm: T, wastePct: 5, dosageKgPerM3: 350, bagKg: 50 })
  const wall = calcBlocks({ lengthM: WL, heightM: WH, openingsM2: 0, blockLengthCm: 40, blockHeightCm: 20, jointMm: 10, wastePct: 5 })

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-border bg-surface p-5">
        <h3 className="text-lg font-bold">{t("slab")}</h3>
        <SlabIso length={L} width={W} depthCm={T} variant="concrete" locale={locale} labels={{ length: td("length"), width: td("width"), depth: td("depth") }} />
        <div className="grid grid-cols-3 gap-3">
          <NumberField label={td("length")} unit="m" value={lRaw} onChange={setL} step={0.1} locale={locale} />
          <NumberField label={td("width")} unit="m" value={wRaw} onChange={setW} step={0.1} locale={locale} />
          <NumberField label={td("depth")} unit="cm" value={tRaw} onChange={setT} step={1} locale={locale} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label={tr("adjustedVolume")} value={slab.ok ? slab.value.adjustedVolume : null} unit="m³" decimals={2} locale={locale} />
          <Stat label={tr("cementBags")} value={slab.ok ? slab.value.bags : null} unit={tu("bags")} locale={locale} />
        </div>
        <Link href={`/${locale}/calculateurs/beton?lengthM=${L}&widthM=${W}&thicknessCm=${T}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-text">
          {t("openConcrete")} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
      <div className="rounded-3xl border border-border bg-surface p-5">
        <h3 className="text-lg font-bold">{t("wall")}</h3>
        <WallElevation length={WL} height={WH} blockL={40} blockH={20} locale={locale} labels={{ length: td("length"), height: td("height"), developed: td("developed") }} />
        <div className="grid grid-cols-2 gap-3">
          <NumberField label={td("length")} unit="m" value={wlRaw} onChange={setWl} step={0.1} locale={locale} />
          <NumberField label={td("height")} unit="m" value={whRaw} onChange={setWh} step={0.05} locale={locale} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label={tr("netWallArea")} value={wall.ok ? wall.value.netArea : null} unit="m²" decimals={2} locale={locale} />
          <Stat label={tr("units")} value={wall.ok ? wall.value.units : null} unit={tu("units")} locale={locale} />
        </div>
        <Link href={`/${locale}/calculateurs/murs-blocs?lengthM=${WL}&heightM=${WH}&openingsM2=0`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-text">
          {t("openBlocks")} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

export function StudioClient() {
  const t = useTranslations("xp.studio")
  const [tab, setTab] = useState<TabKey>("room")

  useEffect(() => {
    const fromHash = window.location.hash.replace("#", "") as TabKey
    if (TABS.some((x) => x.key === fromHash)) setTab(fromHash)
  }, [])

  const select = (key: TabKey) => {
    setTab(key)
    window.history.replaceState(null, "", `#${key}`)
  }

  const panel = useMemo(() => {
    if (tab === "room") return <RoomSimulator />
    if (tab === "materials") return <MaterialVisualizer />
    if (tab === "layout") return <LayoutExplorer />
    if (tab === "structure") return <StructureVisualizers />
    return (
      <div>
        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t("budget.desc")}</p>
        <div className="-mx-4 sm:-mx-6 lg:-mx-10">
          <BudgetEstimator />
        </div>
      </div>
    )
  }, [tab, t])

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-20 sm:px-6 lg:px-10">
      <div role="tablist" aria-label={t("kicker")} className="no-scrollbar sticky top-[64px] z-30 -mx-4 mb-8 flex gap-2 overflow-x-auto border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:top-[120px] lg:-mx-10 lg:px-10">
        {TABS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`tab-${key}`}
            aria-selected={tab === key}
            aria-controls={`panel-${key}`}
            onClick={() => select(key)}
            className={cn(
              "inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors",
              tab === key ? "bg-foreground text-background" : "border border-border text-foreground/75 hover:text-foreground"
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {t(`tabs.${key}`)}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {panel}
      </div>
    </div>
  )
}

export { formatNumber }

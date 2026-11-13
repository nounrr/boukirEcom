"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight, Bath, Check, ClipboardCopy, CookingPot, Hammer, HardHat, Layers, MessageCircle, PaintRoller, PencilLine, PiggyBank, Printer, RotateCcw, Store, Umbrella, Wrench } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { formatNumber } from "@/components/motion/primitives"
import { NumberField, toInput } from "@/components/tools/fields"
import { RoomPlan } from "@/components/tools/diagrams/room-plan"
import { catalogHref, categories as catalogCategories } from "@/lib/catalog/registry"
import { parseDecimal } from "@/lib/calculators/core"
import { calcBagMaterial, calcBlocks, calcConcrete, calcPaint, calcPlaster, calcTiles, calcWaterproofing } from "@/lib/calculators/formulas"
import { whatsappHref } from "@/lib/contact"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "bd-planner-v1"
const STEPS = ["type", "dimensions", "materials", "calculate", "review", "action"] as const

type ProjectType = "renovation" | "bathroom" | "kitchen" | "flooring" | "painting" | "waterproofing" | "construction"
type MatKey = "floorTiles" | "wallTiles" | "adhesive" | "paint" | "ceilingPaint" | "plaster" | "waterproofing" | "concrete" | "blocks"

const TYPES: { key: ProjectType; icon: typeof Hammer; mats: MatKey[] }[] = [
  { key: "renovation", icon: Hammer, mats: ["floorTiles", "adhesive", "paint", "plaster"] },
  { key: "bathroom", icon: Bath, mats: ["floorTiles", "wallTiles", "adhesive", "waterproofing"] },
  { key: "kitchen", icon: CookingPot, mats: ["floorTiles", "wallTiles", "adhesive", "paint"] },
  { key: "flooring", icon: Layers, mats: ["floorTiles", "adhesive"] },
  { key: "painting", icon: PaintRoller, mats: ["paint", "ceilingPaint", "plaster"] },
  { key: "waterproofing", icon: Umbrella, mats: ["waterproofing"] },
  { key: "construction", icon: HardHat, mats: ["concrete", "blocks"] },
]
const ALL_MATS: MatKey[] = ["floorTiles", "wallTiles", "adhesive", "paint", "ceilingPaint", "plaster", "waterproofing", "concrete", "blocks"]

const MAT_META: Record<MatKey, { calc: string; category: number }> = {
  floorTiles: { calc: "carrelage", category: 50 },
  wallTiles: { calc: "carrelage", category: 50 },
  adhesive: { calc: "colle-mortier", category: 50 },
  paint: { calc: "peinture", category: 72 },
  ceilingPaint: { calc: "peinture", category: 72 },
  plaster: { calc: "platre-enduit", category: 72 },
  waterproofing: { calc: "etancheite", category: 75 },
  concrete: { calc: "beton", category: 73 },
  blocks: { calc: "murs-blocs", category: 36 },
}

type Draft = { step: number; type: ProjectType | null; dims: Record<"L" | "W" | "H" | "doors" | "windows" | "slab", string>; mats: MatKey[] }

const EMPTY: Draft = { step: 0, type: null, dims: { L: "4", W: "3", H: "2.7", doors: "1", windows: "1", slab: "12" }, mats: [] }

type Line = { key: MatKey; quantity: number; unit: string; detail: string; assumption: string; href: string }

export function PlannerClient() {
  const t = useTranslations("xp.planner")
  const tu = useTranslations("xp.units")
  const tr = useTranslations("xp.results")
  const tt = useTranslations("xp.tools")
  const locale = useLocale()
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) setDraft({ ...EMPTY, ...JSON.parse(saved) })
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    } catch {
      /* ignore */
    }
  }, [draft, hydrated])

  const n = (k: keyof Draft["dims"]) => parseDecimal(draft.dims[k]) ?? 0
  const L = n("L")
  const W = n("W")
  const H = n("H")
  const doors = Math.round(n("doors"))
  const windows = Math.round(n("windows"))
  const slab = n("slab")
  const setDim = (k: keyof Draft["dims"], v: string) => setDraft((d) => ({ ...d, dims: { ...d.dims, [k]: v } }))
  const go = (step: number) => {
    setDraft((d) => ({ ...d, step }))
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })
  }

  const lines = useMemo<Line[]>(() => {
    const out: Line[] = []
    const fmt = (v: number, d = 0) => formatNumber(v, locale, d)
    const has = (k: MatKey) => draft.mats.includes(k)
    const wallTileArea = Math.max(0, 2 * (L + W) * 1.2 - doors * 0.9 * 1.2)
    let tiledArea = 0
    if (has("floorTiles")) {
      const r = calcTiles({ lengthM: L, widthM: W, tileLengthCm: 60, tileWidthCm: 60, packMode: "area", m2PerBox: 1.44, wastePct: 10 })
      if (r.ok) {
        tiledArea += r.value.netArea
        out.push({ key: "floorTiles", quantity: r.value.boxes ?? 0, unit: tu("boxes"), detail: `${fmt(r.value.netArea, 2)} m² · ${fmt(r.value.tiles)} ${tu("tiles")}`, assumption: "60×60 cm · 1,44 m²/boîte · 10 %", href: `carrelage?lengthM=${L}&widthM=${W}` })
      }
    }
    if (has("wallTiles")) {
      const r = calcTiles({ lengthM: 0, widthM: 0, extraAreaM2: wallTileArea, tileLengthCm: 60, tileWidthCm: 30, packMode: "area", m2PerBox: 1.44, wastePct: 12 })
      if (r.ok) {
        tiledArea += r.value.netArea
        out.push({ key: "wallTiles", quantity: r.value.boxes ?? 0, unit: tu("boxes"), detail: `${fmt(r.value.netArea, 2)} m²`, assumption: "30×60 cm · h 1,20 m · 12 %", href: `carrelage?area=${Math.round(wallTileArea * 100) / 100}&format=custom&tileLengthCm=60&tileWidthCm=30` })
      }
    }
    if (has("adhesive") && tiledArea > 0) {
      const r = calcBagMaterial({ areaM2: tiledArea, mode: "perM2", consumption: 4, bagKg: 25, wastePct: 10 })
      if (r.ok) out.push({ key: "adhesive", quantity: r.value.bags, unit: tu("bags"), detail: `${fmt(r.value.kg, 0)} kg`, assumption: "4 kg/m² · 25 kg · 10 %", href: `colle-mortier?areaM2=${Math.round(tiledArea * 100) / 100}` })
    }
    if (has("paint")) {
      const r = calcPaint({ mode: "room", lengthM: L, widthM: W, heightM: H, doors, windows, coats: 2, coverageM2PerL: 10, wastePct: 5, containerL: 15 })
      if (r.ok) out.push({ key: "paint", quantity: r.value.liters, unit: "L", detail: `${fmt(r.value.paintableArea, 2)} m² · ${r.value.containers} × 15 L`, assumption: "2 couches · 10 m²/L · 5 %", href: `peinture?lengthM=${L}&widthM=${W}&heightM=${H}&doors=${doors}&windows=${windows}` })
    }
    if (has("ceilingPaint")) {
      const r = calcPaint({ mode: "wall", lengthM: L, heightM: W, coats: 2, coverageM2PerL: 10, wastePct: 5, containerL: 15 })
      if (r.ok) out.push({ key: "ceilingPaint", quantity: r.value.liters, unit: "L", detail: `${fmt(r.value.paintableArea, 2)} m²`, assumption: "2 couches · 10 m²/L · 5 %", href: `peinture?mode=wall&lengthM=${L}&heightM=${W}&doors=0&windows=0` })
    }
    if (has("plaster")) {
      const wallNet = Math.max(0, 2 * (L + W) * H - doors * 1.89 - windows * 1.2)
      const r = calcPlaster({ mode: "coat", lengthM: wallNet, widthM: 1, thicknessMm: 2, consumptionKgPerM2Mm: 1, bagKg: 25, wastePct: 10 })
      if (r.ok) out.push({ key: "plaster", quantity: r.value.bags ?? 0, unit: tu("bags"), detail: `${fmt(r.value.kg ?? 0, 0)} kg`, assumption: "2 mm moyen · 1 kg/m²/mm · 25 kg", href: `platre-enduit?lengthM=${Math.round(wallNet * 100) / 100}&widthM=1&thicknessMm=2` })
    }
    if (has("waterproofing")) {
      const upstand = draft.type === "bathroom" ? 20 : 15
      const r = calcWaterproofing({ mode: "liquid", lengthM: L, widthM: W, upstandCm: upstand, coats: 2, consumptionKgPerM2: 1.5, packKg: 20, wastePct: 5 })
      if (r.ok) out.push({ key: "waterproofing", quantity: r.value.packs, unit: tu("packs"), detail: `${fmt(r.value.totalArea, 2)} m² · ${fmt(r.value.materialKg ?? 0, 0)} kg`, assumption: `2 × 1,5 kg/m² · relevés ${upstand} cm · 20 kg`, href: `etancheite?lengthM=${L}&widthM=${W}&upstandCm=${upstand}` })
    }
    if (has("concrete")) {
      const r = calcConcrete({ shape: "rect", lengthM: L, widthM: W, thicknessCm: slab, wastePct: 5, dosageKgPerM3: 350, bagKg: 50 })
      if (r.ok) out.push({ key: "concrete", quantity: r.value.bags, unit: tu("bags"), detail: `${fmt(r.value.adjustedVolume, 2)} m³`, assumption: "350 kg/m³ (indicatif) · 50 kg · 5 %", href: `beton?lengthM=${L}&widthM=${W}&thicknessCm=${slab}` })
    }
    if (has("blocks")) {
      const r = calcBlocks({ lengthM: 2 * (L + W), heightM: H, openingsM2: doors * 1.89 + windows * 1.2, blockLengthCm: 40, blockHeightCm: 20, jointMm: 10, wastePct: 5 })
      if (r.ok) out.push({ key: "blocks", quantity: r.value.units, unit: tu("units"), detail: `${fmt(r.value.netArea, 2)} m²`, assumption: "agglo 40×20 · joint 10 mm · 5 %", href: `murs-blocs?lengthM=${2 * (L + W)}&heightM=${H}&openingsM2=${Math.round((doors * 1.89 + windows * 1.2) * 100) / 100}` })
    }
    return out
  }, [draft.mats, draft.type, L, W, H, doors, windows, slab, locale, tu])

  const typeLabel = draft.type ? t(`types.${draft.type}.title`) : "—"
  const summary = useMemo(() => {
    const rows = [
      `${t("kicker")} — ${typeLabel}`,
      "",
      `${t("review.dimensions")} : ${formatNumber(L, locale, 2)} × ${formatNumber(W, locale, 2)} m · h ${formatNumber(H, locale, 2)} m`,
      "",
      `${t("review.quantities")} :`,
      ...lines.map((l) => `• ${t(`mats.${l.key}`)} : ${formatNumber(l.quantity, locale, l.unit === "L" ? 1 : 0)} ${l.unit} (${l.detail})`),
      "",
      t("review.unknownDesc"),
      t("review.labor"),
      tt("summary.disclaimer"),
    ]
    return rows.join("\n")
  }, [lines, typeLabel, L, W, H, locale, t, tt])

  const step = STEPS[draft.step]
  const canNext = step === "type" ? Boolean(draft.type) : step === "materials" ? draft.mats.length > 0 : step === "dimensions" ? L > 0 && W > 0 : true
  const wa = whatsappHref(summary)
  const suggestions = Array.from(new Set(lines.map((l) => MAT_META[l.key].category)))
    .map((id) => catalogCategories.find((c) => c.id === id && !c.search))
    .filter(Boolean)

  const copyList = async () => {
    try {
      await navigator.clipboard.writeText(summary)
      toast.success(t("action.listCopied"))
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-28 sm:px-6">
      {/* Progress */}
      <div className="no-print mb-10">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("stepOf", { current: draft.step + 1, total: STEPS.length })}</span>
          <span className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-accent-text" aria-hidden="true" />{t("draftSaved")}</span>
        </div>
        <ol className="mt-3 grid grid-cols-6 gap-1.5">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                disabled={i > draft.step && !(i === draft.step + 1 && canNext)}
                onClick={() => go(i)}
                aria-current={i === draft.step ? "step" : undefined}
                className="group block w-full text-start disabled:cursor-not-allowed"
              >
                <span className={cn("block h-1 rounded-full transition-colors duration-500", i <= draft.step ? "bg-gold" : "bg-border")} />
                <span className={cn("mt-2 hidden text-xs font-medium sm:block", i === draft.step ? "text-foreground" : "text-muted-foreground")}>{t(`steps.${s}`)}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div key={step} className="motion-safe:animate-[bd-rise_0.6s_var(--ease-premium)_both]">
        {step === "type" ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label={t("steps.type")}>
            {TYPES.map(({ key, icon: Icon, mats }) => (
              <li key={key}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={draft.type === key}
                  onClick={() => setDraft((d) => ({ ...d, type: key, mats }))}
                  className={cn(
                    "flex h-full w-full flex-col items-start rounded-3xl border p-6 text-start transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5",
                    draft.type === key ? "border-primary bg-accent" : "border-border bg-surface hover:border-foreground/25"
                  )}
                >
                  <span className={cn("grid size-12 place-items-center rounded-2xl transition-colors", draft.type === key ? "bg-gold text-ink" : "bg-muted")}>
                    <Icon className="size-5" strokeWidth={1.6} aria-hidden="true" />
                  </span>
                  <span className="mt-5 text-lg font-bold">{t(`types.${key}.title`)}</span>
                  <span className="mt-1 text-sm text-muted-foreground">{t(`types.${key}.desc`)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {step === "dimensions" ? (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-3xl border border-border bg-surface p-4 sm:p-6">
              <RoomPlan
                length={L}
                width={W}
                locale={locale}
                labels={{ length: t("dims.length"), width: t("dims.width"), area: tr("netArea"), handle: t("dims.length") }}
                onResize={(next) => {
                  if (next.length !== undefined) setDim("L", toInput(next.length, locale))
                  if (next.width !== undefined) setDim("W", toInput(next.width, locale))
                }}
              />
            </div>
            <div>
              <h2 className="mb-5 text-xl font-bold">{t("dims.title")}</h2>
              <div className="grid grid-cols-2 gap-4">
                <NumberField label={t("dims.length")} unit="m" value={draft.dims.L} onChange={(v) => setDim("L", v)} step={0.1} locale={locale} />
                <NumberField label={t("dims.width")} unit="m" value={draft.dims.W} onChange={(v) => setDim("W", v)} step={0.1} locale={locale} />
                <NumberField label={t("dims.height")} unit="m" value={draft.dims.H} onChange={(v) => setDim("H", v)} step={0.05} locale={locale} className="col-span-2" />
                <NumberField label={t("dims.doors")} value={draft.dims.doors} onChange={(v) => setDim("doors", v)} step={1} locale={locale} />
                <NumberField label={t("dims.windows")} value={draft.dims.windows} onChange={(v) => setDim("windows", v)} step={1} locale={locale} />
                {draft.type === "construction" ? <NumberField label={t("dims.slabThickness")} unit="cm" value={draft.dims.slab} onChange={(v) => setDim("slab", v)} step={1} locale={locale} className="col-span-2" /> : null}
              </div>
            </div>
          </div>
        ) : null}

        {step === "materials" ? (
          <div>
            <h2 className="text-xl font-bold">{t("mats.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("mats.desc")}</p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ALL_MATS.map((key) => {
                const checked = draft.mats.includes(key)
                return (
                  <li key={key}>
                    <label className={cn("flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors", checked ? "border-primary bg-accent" : "border-border bg-surface hover:border-foreground/25")}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setDraft((d) => ({ ...d, mats: checked ? d.mats.filter((m) => m !== key) : [...d.mats, key] }))}
                        className="size-4 accent-[var(--primary)]"
                      />
                      <span className="text-sm font-medium">{t(`mats.${key}`)}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}

        {step === "calculate" ? (
          <div>
            <h2 className="text-xl font-bold">{t("calc.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("calc.desc")}</p>
            {lines.length === 0 ? (
              <p className="mt-6 rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t("calc.nothing")}</p>
            ) : (
              <ul className="mt-6 space-y-3">
                {lines.map((line, index) => (
                  <li key={line.key} className="grid gap-3 rounded-3xl border border-border bg-surface p-5 sm:grid-cols-[1fr_auto] sm:items-center" style={{ animationDelay: `${index * 60}ms` }}>
                    <div>
                      <p className="font-semibold">{t(`mats.${line.key}`)}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{line.detail}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground/80">{line.assumption}</p>
                    </div>
                    <div className="flex items-center justify-between gap-5 sm:justify-end">
                      <p className="text-3xl font-extrabold tabular">
                        {formatNumber(line.quantity, locale, line.unit === "L" ? 1 : 0)}
                        <span className="ms-1.5 text-sm font-semibold text-accent-text">{line.unit}</span>
                      </p>
                      <Link href={`/${locale}/calculateurs/${line.href}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold hover:border-primary">
                        {t("calc.detail")} <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden="true" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {step === "review" ? (
          <div className="overflow-hidden rounded-[2rem] border border-border bg-surface">
            <div className="bg-ink p-7 text-white sm:p-9">
              <p className="kicker !text-brand-yellow">{t("review.title")}</p>
              <p className="display-lg mt-3 text-3xl">{typeLabel}</p>
              <p className="mt-2 text-white/60 tabular">{formatNumber(L, locale, 2)} × {formatNumber(W, locale, 2)} m · h {formatNumber(H, locale, 2)} m · {formatNumber(L * W, locale, 2)} m²</p>
            </div>
            <div className="grid gap-8 p-7 sm:p-9 lg:grid-cols-2">
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("review.quantities")}</h3>
                <dl className="mt-4 divide-y divide-border">
                  {lines.map((line) => (
                    <div key={line.key} className="flex justify-between gap-4 py-3 text-sm">
                      <dt>{t(`mats.${line.key}`)}</dt>
                      <dd className="font-semibold tabular">{formatNumber(line.quantity, locale, line.unit === "L" ? 1 : 0)} {line.unit}</dd>
                    </div>
                  ))}
                </dl>
              </section>
              <section className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("review.costs")}</h3>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-muted/60 p-4"><p className="text-xs text-muted-foreground">{t("review.known")}</p><p className="mt-1 text-xl font-bold">—</p></div>
                    <div className="rounded-2xl bg-accent p-4"><p className="text-xs text-muted-foreground">{t("review.unknown")}</p><p className="mt-1 text-xl font-bold">{lines.length}</p></div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("review.unknownDesc")} {t("review.labor")}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("review.assumptions")}</h3>
                  <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                    {lines.map((l) => <li key={l.key}>• {t(`mats.${l.key}`)} — {l.assumption}</li>)}
                    <li>• {tt("summary.disclaimer")}</li>
                  </ul>
                </div>
                {suggestions.length ? (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("review.suggestions")}</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {suggestions.map((c) => (
                        <Link key={c!.slug} href={catalogHref(locale, "categories", c!.id)} className="inline-flex h-9 items-center rounded-full bg-muted px-3.5 text-xs font-semibold hover:bg-primary hover:text-primary-foreground">
                          {(c as unknown as Record<string, string>)[locale] ?? c!.fr}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          </div>
        ) : null}

        {step === "action" ? (
          <div>
            <h2 className="display-lg text-3xl">{t("action.title")}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Store, label: t("action.shop"), href: `/${locale}/shop` },
                { icon: PiggyBank, label: t("action.budget"), href: `/${locale}/calculateurs/budget` },
                { icon: Wrench, label: t("action.maalem"), href: `/${locale}/services` },
              ].map((a) => (
                <Link key={a.label} href={a.href} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-5 font-semibold transition-colors hover:border-primary">
                  <a.icon className="size-5 text-accent-text" aria-hidden="true" /> {a.label}
                </Link>
              ))}
              <button type="button" onClick={copyList} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-5 text-start font-semibold transition-colors hover:border-primary">
                <ClipboardCopy className="size-5 text-accent-text" aria-hidden="true" /> {t("action.list")}
              </button>
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border border-[#1f9d55]/40 bg-surface p-5 font-semibold transition-colors hover:border-[#1f9d55]">
                  <MessageCircle className="size-5 text-[#1f9d55]" aria-hidden="true" /> {t("action.whatsapp")}
                </a>
              ) : null}
              <button type="button" onClick={() => window.print()} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-5 text-start font-semibold transition-colors hover:border-primary">
                <Printer className="size-5 text-accent-text" aria-hidden="true" /> {t("action.print")}
              </button>
              <button type="button" onClick={() => go(0)} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-5 text-start font-semibold transition-colors hover:border-primary">
                <PencilLine className="size-5 text-accent-text" aria-hidden="true" /> {t("action.edit")}
              </button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">{t("action.note")}</p>
            <pre className="print-only mt-8 whitespace-pre-wrap text-sm">{summary}</pre>
          </div>
        ) : null}
      </div>

      {/* Navigation */}
      <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl lg:static lg:mt-10 lg:border-0 lg:bg-transparent lg:p-0">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-3">
          {draft.step > 0 ? (
            <button type="button" onClick={() => go(draft.step - 1)} className="inline-flex h-12 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold">
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" /> {t("back")}
            </button>
          ) : (
            <button type="button" onClick={() => setDraft(EMPTY)} className="inline-flex h-12 items-center gap-2 rounded-full px-3 text-sm font-medium text-muted-foreground hover:text-foreground">
              <RotateCcw className="size-4" aria-hidden="true" /> {t("reset")}
            </button>
          )}
          {draft.step < STEPS.length - 1 ? (
            <button type="button" disabled={!canNext} onClick={() => go(draft.step + 1)} className="inline-flex h-12 items-center gap-2 rounded-full bg-gold px-6 text-sm font-semibold text-ink transition-opacity disabled:opacity-40">
              {t("next")} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

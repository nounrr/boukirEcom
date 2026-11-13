"use client"

import { AlertTriangle, ArrowRight, ExternalLink, PackageSearch, ShieldCheck } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useMemo, useState } from "react"

import { AnimatedNumber, formatNumber } from "@/components/motion/primitives"
import { catalogHref, categories as catalogCategories } from "@/lib/catalog/registry"
import { parseDecimal } from "@/lib/calculators/core"
import { applyPrefill, defaultValues, getCalculator, type CalculatorDef, type FieldDef, type FieldGroup, type ResultRow, type Values } from "@/lib/calculators/registry"
import { cn } from "@/lib/utils"
import { CalculatorActions } from "./calculator-actions"
import { ChoiceField, NumberField, ToggleField } from "./fields"
import { RoomPlan, type LayoutPattern } from "./diagrams/room-plan"
import { QuantityGlyphs, RoofSection, SlabIso, WallElevation } from "./diagrams/other-diagrams"
import { toInput } from "./fields"

export type ProductContext = {
  id: number
  name: string
  price: number | null
  /** pack description, e.g. "25 kg" and where it came from */
  pack?: { value: string; source: "catalog" | "name" } | null
}

const GROUP_ORDER: FieldGroup[] = ["dimensions", "material", "packaging", "assumptions", "pricing"]

function num(v: Values, key?: string): number {
  if (!key) return 0
  return parseDecimal(v[key]) ?? 0
}

export function useUnitLabel() {
  const tu = useTranslations("xp.units")
  return useCallback((unit: string) => (unit.startsWith("u:") ? tu(unit.slice(2)) : unit), [tu])
}

function CalculatorDiagram({ def, values, onChange }: { def: CalculatorDef; values: Values; onChange: (key: string, value: string) => void }) {
  const locale = useLocale()
  const t = useTranslations("xp.tools.diagram")
  const tu = useTranslations("xp.units")
  const spec = def.diagram

  if (spec.type === "room") {
    return (
      <RoomPlan
        length={num(values, spec.lengthKey)}
        width={num(values, spec.widthKey)}
        tileL={spec.tileLKey ? num(values, spec.tileLKey) : null}
        tileW={spec.tileWKey ? num(values, spec.tileWKey) : null}
        pattern={(spec.patternKey ? (values[spec.patternKey] as LayoutPattern) : "straight") || "straight"}
        locale={locale}
        labels={{ length: t("length"), width: t("width"), area: t("area"), handle: t("handle") }}
        onResize={(next) => {
          if (next.length !== undefined) onChange(spec.lengthKey, toInput(next.length, locale))
          if (next.width !== undefined) onChange(spec.widthKey, toInput(next.width, locale))
        }}
      />
    )
  }
  if (spec.type === "wall") {
    const roomMode = spec.roomModeKey ? values[spec.roomModeKey] === "room" : false
    const length = roomMode ? 2 * (num(values, spec.lengthKey) + num(values, spec.widthKey)) : num(values, spec.lengthKey)
    return (
      <WallElevation
        length={length}
        height={num(values, spec.heightKey)}
        doors={num(values, spec.doorsKey)}
        windows={num(values, spec.windowsKey)}
        blockL={spec.blockLKey ? num(values, spec.blockLKey) : null}
        blockH={spec.blockHKey ? num(values, spec.blockHKey) : null}
        developed={roomMode}
        locale={locale}
        labels={{ length: t("length"), height: t("height"), developed: t("developed") }}
      />
    )
  }
  if (spec.type === "slab") {
    return (
      <SlabIso
        length={num(values, spec.lengthKey)}
        width={values.shape === "cylinder" ? num(values, "diameterCm") / 100 : num(values, spec.widthKey)}
        depthCm={num(values, spec.depthKey)}
        variant={spec.variant}
        locale={locale}
        labels={{ length: t("length"), width: t("width"), depth: t("depth") }}
      />
    )
  }
  if (spec.type === "roof") {
    const pitchMode = values[spec.modeKey] === "pitch"
    const pitch = pitchMode ? num(values, spec.pitchKey) : null
    const slope = pitchMode ? num(values, spec.runKey) / Math.cos(((pitch ?? 30) * Math.PI) / 180) : num(values, spec.slopeKey)
    return (
      <RoofSection
        slopeLength={slope}
        pitchDeg={pitch}
        planes={Math.max(1, Math.round(num(values, spec.planesKey)))}
        eave={num(values, spec.eaveKey)}
        locale={locale}
        labels={{ slope: t("slope"), pitch: t("pitch"), eave: t("eave"), planes: t("planes") }}
      />
    )
  }
  const res = def.compute(values)
  const bags = res.ok ? (def.primary(res.value).value ?? 0) : 0
  return (
    <div className="grid min-h-[260px] place-items-center p-6">
      <div className="w-full max-w-md">
        <p className="mb-4 text-sm text-muted-foreground">{t("bagsCaption", { count: bags })}</p>
        <QuantityGlyphs count={bags} label={tu("bags")} />
      </div>
    </div>
  )
}

export function CalculatorView({
  slug,
  initialParams = {},
  product,
}: {
  slug: string
  initialParams?: Record<string, string | undefined>
  product?: ProductContext | null
}) {
  const def = getCalculator(slug)!
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations("xp.tools")
  const tf = useTranslations("xp.fields")
  const to = useTranslations("xp.options")
  const th = useTranslations("xp.help")
  const tr = useTranslations("xp.results")
  const ta = useTranslations("xp.assumptions")
  const te = useTranslations("xp.errors")
  const tc = useTranslations("xp.calc")
  const unitLabel = useUnitLabel()

  const initial = useMemo(() => applyPrefill(def, defaultValues(def), initialParams), [def, initialParams])
  const [values, setValues] = useState<Values>(initial)

  const setValue = useCallback(
    (key: string, value: string | boolean) => {
      setValues((prev) => {
        const next: Values = { ...prev, [key]: value }
        const field = def.fields.find((f) => f.key === key && f.kind === "select")
        if (field && field.kind === "select") {
          const option = field.options.find((o) => o.value === value)
          if (option?.patch) Object.assign(next, option.patch)
        }
        return next
      })
    },
    [def]
  )

  const result = useMemo(() => def.compute(values), [def, values])
  const errors = useMemo(() => {
    const map: Record<string, string> = {}
    if (!result.ok) for (const issue of result.issues) map[issue.field] = te(issue.code)
    return map
  }, [result, te])

  const visibleFields = def.fields.filter((f) => !f.when || f.when(values))
  const primary: ResultRow | null = result.ok ? def.primary(result.value) : null
  const rows: ResultRow[] = result.ok ? def.rows(result.value, values) : []
  const title = tc(`${slug}.title`)

  const fmtRow = (row: ResultRow) => (row.value === null ? tr(row.nullLabel ?? "priceUnavailable") : `${formatNumber(row.value, locale, row.decimals ?? 0)} ${unitLabel(row.unit)}`)

  const getShareUrl = useCallback(() => {
    const defaults = defaultValues(def)
    const params = new URLSearchParams()
    for (const field of def.fields) {
      const value = values[field.key]
      if (value === undefined || value === defaults[field.key] || params.has(field.key)) continue
      params.set(field.key, String(value))
    }
    const qs = params.toString()
    return `${window.location.origin}${pathname}${qs ? `?${qs}` : ""}`
  }, [def, values, pathname])

  const getSummary = useCallback(() => {
    const lines = [`${t("summary.heading")} — ${title}`, ""]
    lines.push(`${t("summary.inputs")} :`)
    for (const field of visibleFields) {
      if (field.group === "pricing" && !values[field.key]) continue
      const raw = values[field.key]
      const display =
        field.kind === "select" ? to(field.options.find((o) => o.value === raw)?.label ?? String(raw)) : field.kind === "toggle" ? (raw ? "✓" : "—") : `${raw} ${field.unit ?? ""}`.trim()
      lines.push(`• ${tf(field.label)} : ${display}`)
    }
    lines.push("", `${t("summary.results")} :`)
    for (const row of rows) lines.push(`• ${tr(row.label)} : ${fmtRow(row)}`)
    lines.push("", `${t("summary.assumptions")} :`)
    for (const key of def.assumptions) lines.push(`• ${ta(key)}`)
    lines.push("", t("summary.disclaimer"), `${t("summary.date")} : ${new Date().toLocaleString(locale === "ar" ? "ar-MA" : locale)}`, getShareUrl())
    return lines.join("\n")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, rows, title, locale, getShareUrl])

  const grouped = GROUP_ORDER.map((group) => ({ group, fields: visibleFields.filter((f) => f.group === group) })).filter((g) => g.fields.length)

  const renderField = (field: FieldDef) => {
    const key = `${field.key}-${field.label}`
    if (field.kind === "select") {
      return (
        <ChoiceField
          key={key}
          label={tf(field.label)}
          value={String(values[field.key])}
          options={field.options.map((o) => ({ value: o.value, label: to(o.label) }))}
          onChange={(next) => setValue(field.key, next)}
        />
      )
    }
    if (field.kind === "toggle") {
      return <ToggleField key={key} label={tf(field.label)} checked={values[field.key] === true} onChange={(next) => setValue(field.key, next)} />
    }
    return (
      <NumberField
        key={key}
        label={tf(field.label)}
        unit={field.unit === "u" ? undefined : field.unit}
        value={String(values[field.key] ?? "")}
        onChange={(next) => setValue(field.key, next)}
        step={field.step}
        slider={field.slider}
        presets={field.presets}
        error={errors[field.key]}
        help={field.help ? th(field.help) : undefined}
        optional={field.optional}
        optionalLabel={t("optional")}
        locale={locale}
      />
    )
  }

  const catalogLinks = def.catalog
    .map((id) => catalogCategories.find((c) => c.id === id && !c.search))
    .filter(Boolean)
    .map((c) => ({ href: catalogHref(locale, "categories", c!.id), label: (c as unknown as Record<string, string>)[locale] ?? c!.fr }))

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-28 sm:px-6 lg:px-10 lg:pb-20">
      {/* print header */}
      <div className="print-only mb-6 border-b pb-4">
        <p className="text-sm font-bold">BOUKIR DIAMOND — {title}</p>
        <p className="text-xs">{t("summary.disclaimer")}</p>
      </div>

      {product ? (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary/30 bg-accent/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <PackageSearch className="mt-0.5 size-5 shrink-0 text-accent-text" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-semibold">{t("productContext", { name: product.name })}</p>
              <p className="mt-0.5 text-muted-foreground">
                {product.price !== null ? t("productPrice", { price: formatNumber(product.price, locale, 2) }) : null}
                {product.pack ? ` · ${t(product.pack.source === "catalog" ? "packCatalog" : "packName", { pack: product.pack.value })}` : null}
              </p>
            </div>
          </div>
          <Link href={`/${locale}/product/${product.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text hover:underline">
            {t("backToProduct")}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)] lg:gap-8">
        {/* Left — diagram + inputs */}
        <div className="min-w-0 space-y-6">
          <section aria-label={t("diagramLabel")} className="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-premium">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("diagramLabel")}</p>
              <p className="text-xs text-muted-foreground">{def.diagram.type === "room" ? t("dragHint") : t("diagramHint")}</p>
            </div>
            <div className="p-3 sm:p-5">
              <CalculatorDiagram def={def} values={values} onChange={setValue} />
            </div>
          </section>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()} noValidate>
            {grouped.map(({ group, fields }) => (
              <fieldset key={group} className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
                <legend className="sr-only">{t(`groups.${group}`)}</legend>
                <p aria-hidden="true" className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="h-px w-6 bg-primary" />
                  {t(`groups.${group}`)}
                </p>
                <div className="grid gap-5 sm:grid-cols-2">{fields.map(renderField)}</div>
              </fieldset>
            ))}
          </form>
        </div>

        {/* Right — sticky results */}
        <aside id="calc-results" aria-label={t("resultsLabel")} className="lg:sticky lg:top-[136px] lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-ink text-white shadow-[0_40px_80px_-40px_rgba(13,13,13,0.8)]">
            <div className="relative p-6 sm:p-7">
              <div className="pointer-events-none absolute -end-20 -top-20 size-56 rounded-full bg-brand-orange/25 blur-3xl" aria-hidden="true" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-yellow">{t("estimate")}</p>
              {primary && primary.value !== null ? (
                <div className="mt-3" aria-live="polite" aria-atomic="true">
                  <p className="flex items-baseline gap-3">
                    <AnimatedNumber value={primary.value} locale={locale} decimals={primary.decimals ?? 0} className="text-6xl font-extrabold tracking-tight sm:text-7xl" />
                    <span className="text-lg font-semibold text-brand-yellow">{unitLabel(primary.unit)}</span>
                  </p>
                  <p className="mt-1 text-sm text-white/60">{tr(primary.label)}</p>
                </div>
              ) : (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm" role="alert">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#f2695a]" aria-hidden="true" />
                  <p>{t("fixErrors")}</p>
                </div>
              )}
              {result.ok && "openingsExceedWalls" in (result.value as object) && (result.value as { openingsExceedWalls: boolean }).openingsExceedWalls ? (
                <p className="mt-3 text-xs text-[#f2b705]">{t("openingsWarning")}</p>
              ) : null}
            </div>

            {rows.length ? (
              <dl className="divide-y divide-white/[0.07] border-t border-white/[0.07]">
                {rows.map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-4 px-6 py-3 sm:px-7">
                    <dt className="text-sm text-white/60">{tr(row.label)}</dt>
                    <dd className={cn("text-end text-sm tabular", row.value === null ? "text-white/40 italic" : row.emphasis ? "font-bold text-white" : "font-medium text-white/85")}>{fmtRow(row)}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="border-t border-white/[0.07] p-6 sm:p-7">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-white/85 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-brand-yellow" aria-hidden="true" />
                    {t("assumptionsTitle")}
                  </span>
                  <span className="text-xs text-white/45 group-open:hidden">{t("show")}</span>
                  <span className="hidden text-xs text-white/45 group-open:inline">{t("hide")}</span>
                </summary>
                <ul className="mt-4 space-y-2.5 text-[13px] leading-relaxed text-white/60">
                  {def.assumptions.map((key) => (
                    <li key={key} className="flex gap-2">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-brand-orange" aria-hidden="true" />
                      {ta(key)}
                    </li>
                  ))}
                </ul>
              </details>
              <p className="mt-4 rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-xs leading-relaxed text-white/55">{t("disclaimer")}</p>
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-border bg-surface p-5">
            <CalculatorActions getSummary={getSummary} getShareUrl={getShareUrl} title={title} onReset={() => setValues(defaultValues(def))} />
          </div>

          {catalogLinks.length ? (
            <div className="mt-4 rounded-3xl border border-border bg-surface p-5">
              <p className="text-sm font-semibold">{t("catalogTitle")}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("catalogDesc")}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {catalogLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-muted px-3.5 text-[13px] font-medium transition-colors hover:bg-primary hover:text-primary-foreground">
                      {link.label}
                      <ExternalLink className="size-3.5 opacity-60" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>

      {/* Mobile sticky summary */}
      <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 text-white backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] uppercase tracking-[0.16em] text-white/50">{primary ? tr(primary.label) : t("estimate")}</p>
            <p className="text-2xl font-extrabold tabular">
              {primary && primary.value !== null ? `${formatNumber(primary.value, locale, primary.decimals ?? 0)} ` : "— "}
              <span className="text-sm font-semibold text-brand-yellow">{primary ? unitLabel(primary.unit) : ""}</span>
            </p>
          </div>
          <a href="#calc-results" className="inline-flex h-10 shrink-0 items-center rounded-full bg-gold px-4 text-sm font-semibold text-ink">
            {t("seeDetails")}
          </a>
        </div>
      </div>
    </div>
  )
}

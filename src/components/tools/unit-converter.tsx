"use client"

import { ArrowLeftRight, Info } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { formatNumber } from "@/components/motion/primitives"
import { UNIT_FACTORS, convertUnit, massToVolume, volumeToMass, type Dimension } from "@/lib/calculators/formulas"
import { cn } from "@/lib/utils"
import { ChoiceField, NumberField } from "./fields"

const LABELS: Record<string, string> = { mm: "mm", cm: "cm", m: "m", km: "km", cm2: "cm²", m2: "m²", ha: "ha", cm3: "cm³", L: "L", m3: "m³", g: "g", kg: "kg", t: "t" }

export function UnitConverter() {
  const t = useTranslations("xp.converter")
  const locale = useLocale()
  const [dimension, setDimension] = useState<Dimension | "density">("length")
  const [value, setValue] = useState("2,5")
  const [from, setFrom] = useState("m")
  const [to, setTo] = useState("cm")
  const [density, setDensity] = useState("")
  const [direction, setDirection] = useState<"v2m" | "m2v">("v2m")

  const units = dimension === "density" ? [] : Object.keys(UNIT_FACTORS[dimension])

  const result = useMemo(() => {
    if (dimension === "density") {
      const r = direction === "v2m" ? volumeToMass(value, density) : massToVolume(value, density)
      return r.ok ? { value: r.value, unit: direction === "v2m" ? "t" : "m³" } : null
    }
    const r = convertUnit(value, dimension, from as never, to as never)
    return r.ok ? { value: r.value, unit: LABELS[to] } : null
  }, [dimension, value, from, to, density, direction])

  const changeDimension = (next: string) => {
    setDimension(next as Dimension | "density")
    if (next !== "density") {
      const keys = Object.keys(UNIT_FACTORS[next as Dimension])
      setFrom(keys[1] ?? keys[0])
      setTo(keys[0])
    }
  }

  const selectCls = "h-12 w-full rounded-xl border border-input bg-surface px-3 text-base font-semibold outline-none focus:border-primary"

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-20 sm:px-6 lg:px-10">
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-premium sm:p-8">
        <ChoiceField
          label={t("dimension")}
          value={dimension}
          onChange={changeDimension}
          options={(["length", "area", "volume", "mass", "density"] as const).map((d) => ({ value: d, label: t(`dimensions.${d}`) }))}
        />

        <div className="mt-8 grid items-end gap-5 md:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-3">
            <NumberField label={t("value")} value={value} onChange={setValue} step={0.1} locale={locale} unit={dimension === "density" ? (direction === "v2m" ? "m³" : "t") : LABELS[from]} />
            {dimension !== "density" ? (
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-foreground/85">{t("from")}</span>
                <select value={from} onChange={(e) => setFrom(e.target.value)} className={selectCls}>
                  {units.map((u) => <option key={u} value={u}>{LABELS[u]}</option>)}
                </select>
              </label>
            ) : (
              <NumberField label={t("density")} unit="t/m³" value={density} onChange={setDensity} step={0.05} locale={locale} help={t("densityHelp")} />
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (dimension === "density") setDirection((d) => (d === "v2m" ? "m2v" : "v2m"))
              else {
                setFrom(to)
                setTo(from)
              }
            }}
            className="mx-auto grid size-12 place-items-center rounded-full bg-ink text-brand-yellow transition-transform hover:rotate-180 md:mb-[60px]"
            aria-label={t("swap")}
          >
            <ArrowLeftRight className="size-5" />
          </button>

          <div className="space-y-3">
            <div className="rounded-2xl bg-ink p-5 text-white" aria-live="polite">
              <p className="text-xs uppercase tracking-[0.18em] text-white/50">{t("result")}</p>
              <p className="mt-2 break-all text-4xl font-extrabold tabular">
                {result ? formatNumber(result.value, locale, 6) : "—"} <span className="text-lg text-brand-yellow">{result?.unit}</span>
              </p>
            </div>
            {dimension !== "density" ? (
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-foreground/85">{t("to")}</span>
                <select value={to} onChange={(e) => setTo(e.target.value)} className={selectCls}>
                  {units.map((u) => <option key={u} value={u}>{LABELS[u]}</option>)}
                </select>
              </label>
            ) : null}
          </div>
        </div>

        <p className={cn("mt-8 flex gap-2 rounded-2xl bg-muted/60 p-4 text-sm leading-relaxed text-muted-foreground")}>
          <Info className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden="true" />
          {t("note")}
        </p>
      </div>
    </div>
  )
}

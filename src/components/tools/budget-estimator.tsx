"use client"

import dynamic from "next/dynamic"
import { Copy, Loader2, Plus, Search, Trash2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import { AnimatedNumber, formatNumber } from "@/components/motion/primitives"
import { useDebounce } from "@/hooks/use-debounce"
import { parseDecimal } from "@/lib/calculators/core"
import { MATERIAL_GROUPS, SERVICE_GROUPS, calcBudget, isMaterialGroup, type BudgetGroup, type BudgetRow } from "@/lib/calculators/formulas"
import { getLocalizedProductName } from "@/lib/localized-fields"
import { cn } from "@/lib/utils"
import { useGetProductsQuery } from "@/state/api/products-api-slice"
import { CalculatorActions } from "./calculator-actions"
import { GROUP_COLORS } from "./budget-chart"

const BudgetDonut = dynamic(() => import("./budget-chart"), { ssr: false, loading: () => <div className="h-[240px] animate-pulse rounded-full bg-muted/60" /> })

const STORAGE_KEY = "bd-budget-v1"

type Scenario = { id: "A" | "B"; rows: BudgetRow[] }
type RawRow = Omit<BudgetRow, "quantity" | "unitPrice"> & { quantity: string; unitPrice: string }

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function toRows(raw: RawRow[]): BudgetRow[] {
  return raw.map((r) => ({ ...r, quantity: parseDecimal(r.quantity) ?? 0, unitPrice: r.unitPrice.trim() === "" ? null : parseDecimal(r.unitPrice) }))
}

function CatalogPicker({ onPick }: { onPick: (row: RawRow) => void }) {
  const t = useTranslations("xp.budget")
  const locale = useLocale()
  const [query, setQuery] = useState("")
  const debounced = useDebounce(query, 300)
  const enabled = debounced.trim().length >= 2
  const { data, isFetching } = useGetProductsQuery({ search: debounced.trim(), per_page: 6, page: 1 } as never, { skip: !enabled })
  const products = (data as { products?: Array<Record<string, any>> } | undefined)?.products ?? []

  return (
    <div className="relative">
      <label className="flex h-11 items-center gap-2 rounded-xl border border-input bg-surface px-3 focus-within:border-primary">
        <Search className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">{t("searchCatalog")}</span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchCatalog")} className="w-full bg-transparent text-sm outline-none" />
        {isFetching ? <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" /> : null}
      </label>
      {enabled && products.length ? (
        <ul className="absolute inset-x-0 top-12 z-20 max-h-72 overflow-auto rounded-xl border border-border bg-popover p-1 shadow-premium">
          {products.map((p) => {
            const offer = p.prix_promo && p.prix_promo < p.prix_vente ? p.prix_promo : p.prix_vente
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick({
                      id: uid(),
                      label: getLocalizedProductName(p, locale) || p.designation,
                      group: "materials",
                      quantity: "1",
                      unit: p.base_unit || "u",
                      unitPrice: typeof offer === "number" ? String(offer) : "",
                      productId: p.id,
                    })
                    setQuery("")
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-start text-sm hover:bg-muted"
                >
                  <span className="min-w-0 truncate">{getLocalizedProductName(p, locale) || p.designation}</span>
                  <span className="shrink-0 font-semibold tabular">{typeof offer === "number" ? `${formatNumber(offer, locale, 2)} MAD` : t("priceUnavailable")}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : enabled && !isFetching ? (
        <p className="mt-2 text-xs text-muted-foreground">{t("noResults")}</p>
      ) : null}
    </div>
  )
}

export function BudgetEstimator() {
  const t = useTranslations("xp.budget")
  const tg = useTranslations("xp.budget.groups")
  const tt = useTranslations("xp.tools")
  const locale = useLocale()
  const pathname = usePathname()
  const [scenarios, setScenarios] = useState<{ A: RawRow[]; B: RawRow[] | null }>({ A: [], B: null })
  const [active, setActive] = useState<"A" | "B">("A")
  const [contingency, setContingency] = useState("10")
  const [hydrated, setHydrated] = useState(false)
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed?.A) setScenarios({ A: parsed.A, B: parsed.B ?? null })
        if (parsed?.contingency) setContingency(String(parsed.contingency))
      } else {
        setScenarios({
          A: [
            { id: uid(), label: t("sample.tiles"), group: "tiles", quantity: "12", unit: t("units.box"), unitPrice: "" },
            { id: uid(), label: t("sample.labor"), group: "labor", quantity: "1", unit: t("units.flat"), unitPrice: "" },
          ],
          B: null,
        })
      }
    } catch {
      /* storage unavailable */
    }
    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...scenarios, contingency }))
    } catch {
      /* ignore */
    }
  }, [scenarios, contingency, hydrated])

  const rows = (active === "B" ? scenarios.B : scenarios.A) ?? []
  const setRows = (next: RawRow[]) => setScenarios((prev) => (active === "B" ? { ...prev, B: next } : { ...prev, A: next }))
  const update = (id: string, patch: Partial<RawRow>) => setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const resultA = useMemo(() => calcBudget(toRows(scenarios.A), contingency), [scenarios.A, contingency])
  const resultB = useMemo(() => (scenarios.B ? calcBudget(toRows(scenarios.B), contingency) : null), [scenarios.B, contingency])
  const result = active === "B" && resultB ? resultB : resultA
  const value = result.ok ? result.value : null
  const money = (v: number) => `${formatNumber(v, locale, 2)} MAD`

  const donut = value
    ? Object.entries(value.byGroup)
        .filter(([, v]) => (v ?? 0) > 0)
        .map(([group, v]) => ({ name: tg(group), value: v as number }))
    : []

  const getSummary = useCallback(() => {
    if (!value) return ""
    const lines = [`${t("summaryHeading")} — ${t("scenario")} ${active}`, ""]
    for (const r of toRows(rows)) lines.push(`• ${r.label} — ${r.quantity} ${r.unit} × ${r.unitPrice === null ? t("priceUnavailable") : money(r.unitPrice)} [${tg(r.group)}]`)
    lines.push("", `${t("materialSubtotal")} : ${money(value.materialSubtotal)}`, `${t("otherSubtotal")} : ${money(value.otherSubtotal)}`, `${t("contingency")} (${contingency} %) : ${money(value.contingency)}`, `${t("total")} : ${money(value.total)}`)
    if (value.unpricedRows) lines.push(t("unpricedNote", { count: value.unpricedRows }))
    lines.push("", tt("summary.disclaimer"), `${tt("summary.date")} : ${new Date().toLocaleString(locale === "ar" ? "ar-MA" : locale)}`)
    return lines.join("\n")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, rows, active, contingency, locale])

  const groups: BudgetGroup[] = [...MATERIAL_GROUPS, ...SERVICE_GROUPS]
  const inputCls = "h-10 w-full rounded-lg border border-input bg-surface px-2.5 text-sm outline-none focus:border-primary"

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-20 sm:px-6 lg:px-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.85fr)] lg:gap-8">
        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {(["A", "B"] as const).map((id) =>
              id === "B" && !scenarios.B ? (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setScenarios((prev) => ({ ...prev, B: prev.A.map((r) => ({ ...r, id: uid() })) }))
                    setActive("B")
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-dashed border-border px-4 text-sm font-medium text-muted-foreground hover:border-primary hover:text-foreground"
                >
                  <Copy className="size-4" aria-hidden="true" />
                  {t("duplicateB")}
                </button>
              ) : (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active === id}
                  onClick={() => setActive(id)}
                  className={cn("h-10 rounded-full px-5 text-sm font-semibold transition-colors", active === id ? "bg-foreground text-background" : "border border-border text-foreground/75")}
                >
                  {t("scenario")} {id}
                </button>
              )
            )}
          </div>

          <div className="rounded-3xl border border-border bg-surface p-4 sm:p-6">
            <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <CatalogPicker onPick={(row) => setRows([...rows, row])} />
              <button
                type="button"
                onClick={() => setRows([...rows, { id: uid(), label: "", group: "other", quantity: "1", unit: "u", unitPrice: "" }])}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold text-background"
              >
                <Plus className="size-4" aria-hidden="true" />
                {t("addRow")}
              </button>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">{t("catalogNote")}</p>

            {rows.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
            ) : (
              <ul className="space-y-3">
                {rows.map((row) => {
                  const qty = parseDecimal(row.quantity) ?? 0
                  const price = row.unitPrice.trim() === "" ? null : parseDecimal(row.unitPrice)
                  return (
                    <li key={row.id} className="grid gap-2 rounded-2xl border border-border p-3 sm:grid-cols-12 sm:items-end">
                      <label className="sm:col-span-4">
                        <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{t("label")}</span>
                        <input value={row.label} onChange={(e) => update(row.id, { label: e.target.value })} className={inputCls} placeholder={t("labelPlaceholder")} />
                      </label>
                      <label className="sm:col-span-2">
                        <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{t("group")}</span>
                        <select value={row.group} onChange={(e) => update(row.id, { group: e.target.value as BudgetGroup })} className={inputCls}>
                          {groups.map((g) => (
                            <option key={g} value={g}>{tg(g)}</option>
                          ))}
                        </select>
                      </label>
                      <label className="sm:col-span-2">
                        <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{t("quantity")}</span>
                        <input inputMode="decimal" value={row.quantity} onChange={(e) => update(row.id, { quantity: e.target.value })} className={cn(inputCls, "tabular")} />
                      </label>
                      <label className="sm:col-span-1">
                        <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{t("unit")}</span>
                        <input value={row.unit} onChange={(e) => update(row.id, { unit: e.target.value })} className={inputCls} />
                      </label>
                      <label className="sm:col-span-2">
                        <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{t("unitPrice")}</span>
                        <input inputMode="decimal" value={row.unitPrice} onChange={(e) => update(row.id, { unitPrice: e.target.value })} placeholder={t("priceUnavailable")} className={cn(inputCls, "tabular")} />
                      </label>
                      <div className="flex items-center justify-between gap-2 sm:col-span-1 sm:justify-end">
                        <span className="text-xs font-semibold tabular sm:hidden">{price === null ? t("priceUnavailable") : money(qty * price)}</span>
                        <button type="button" onClick={() => setRows(rows.filter((r) => r.id !== row.id))} className="grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={t("remove")}>
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      {row.productId ? <p className="text-[11px] text-accent-text sm:col-span-12">{t("fromCatalog")}</p> : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[136px] lg:self-start" aria-label={tt("resultsLabel")}>
          <div className="overflow-hidden rounded-3xl bg-ink p-6 text-white sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-yellow">{t("total")} · {t("scenario")} {active}</p>
            <p className="mt-3 text-5xl font-extrabold tracking-tight" aria-live="polite">
              {value ? <AnimatedNumber value={value.total} locale={locale} decimals={2} /> : "—"}
              <span className="ms-2 text-base font-semibold text-brand-yellow">MAD</span>
            </p>
            <dl className="mt-6 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-white/60">{t("materialSubtotal")}</dt><dd className="font-semibold tabular">{value ? money(value.materialSubtotal) : "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-white/60">{t("otherSubtotal")}</dt><dd className="font-semibold tabular">{value ? money(value.otherSubtotal) : "—"}</dd></div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-white/60">
                  <label htmlFor="contingency">{t("contingency")}</label>
                </dt>
                <dd className="flex items-center gap-2">
                  <input id="contingency" inputMode="decimal" value={contingency} onChange={(e) => setContingency(e.target.value)} className="h-8 w-14 rounded-lg border border-white/15 bg-white/5 text-center text-sm tabular outline-none focus:border-brand-orange" />
                  <span className="text-white/50">%</span>
                  <span className="w-28 text-end font-semibold tabular">{value ? money(value.contingency) : "—"}</span>
                </dd>
              </div>
            </dl>
            {value?.unpricedRows ? <p className="mt-4 rounded-xl bg-white/[0.05] px-3 py-2 text-xs text-[#f2b705]">{t("unpricedNote", { count: value.unpricedRows })}</p> : null}
            {resultB?.ok && resultA.ok ? (
              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">{t("comparison")}</p>
                {(["A", "B"] as const).map((id) => {
                  const total = id === "A" ? resultA.value.total : resultB.value.total
                  const max = Math.max(resultA.value.total, resultB.value.total, 1)
                  return (
                    <div key={id} className="mb-2.5">
                      <div className="mb-1 flex justify-between text-xs"><span>{t("scenario")} {id}</span><span className="tabular">{money(total)}</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gold transition-[width] duration-700" style={{ width: `${(total / max) * 100}%` }} /></div>
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-border bg-surface p-5">
            <p className="mb-2 text-sm font-semibold">{t("breakdown")}</p>
            {donut.length ? (
              <>
                <BudgetDonut data={donut} format={money} />
                <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  {donut.map((d, i) => (
                    <li key={d.name} className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ background: GROUP_COLORS[i % GROUP_COLORS.length] }} aria-hidden="true" />
                      <span className="truncate">{d.name}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noPricedRows")}</p>
            )}
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{t("separationNote")}</p>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-5">
            <CalculatorActions getSummary={getSummary} getShareUrl={() => `${origin}${pathname}`} title={t("summaryHeading")} onReset={() => setScenarios({ A: [], B: null })} />
          </div>
        </aside>
      </div>
    </div>
  )
}

export { isMaterialGroup }

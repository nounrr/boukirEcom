"use client"

import { AccountSidebar } from "@/components/account/account-sidebar"
import { ShopPageLayout } from "@/components/layout/shop-page-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useGetSoldeOrdersHistoryQuery } from "@/state/api/orders-api-slice"
import { useAppSelector } from "@/state/hooks"
import type { SoldeStatementSource } from "@/types/order"
import { useLocale } from "next-intl"
import { useMemo, useState } from "react"

const SOURCE_BADGE: Record<SoldeStatementSource, { label: string; className: string }> = {
  SOLDE_INITIAL: { label: "Solde initial", className: "bg-slate-50 text-slate-700 border-slate-200" },
  BON_ECOMMERCE: { label: "Commande e‑com", className: "bg-blue-50 text-blue-700 border-blue-200" },
  AVOIR_ECOMMERCE: { label: "Avoir e‑com", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  BON_SORTIE: { label: "Bon sortie", className: "bg-amber-50 text-amber-700 border-amber-200" },
  AVOIR_CLIENT: { label: "Avoir client", className: "bg-pink-50 text-pink-700 border-pink-200" },
  PAYMENT: { label: "Paiement", className: "bg-violet-50 text-violet-700 border-violet-200" },
}

function formatMAD(amount: number, locale: string) {
  const safe = Number.isFinite(amount) ? amount : 0
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safe)
  } catch {
    return `${safe.toFixed(2)} MAD`
  }
}

function formatDate(value: string, locale: string) {
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(dt)
}

export default function SoldeHistoriquePage() {
  const locale = useLocale()
  const { isAuthenticated, user, accessToken } = useAppSelector((state) => state.user)

  const isAuthLoading = !!accessToken && !user
  const canUseSolde = user?.is_solde === 1 || user?.is_solde === true

  const [selected, setSelected] = useState<Record<number, boolean>>({})

  const { data, isLoading, refetch, isFetching } = useGetSoldeOrdersHistoryQuery(
    { view: "statement", limit: 500, offset: 0 },
    { skip: !isAuthenticated || !canUseSolde }
  )

  const statement = data && data.view === "statement" ? data : undefined
  const timeline = useMemo(() => statement?.timeline ?? [], [statement?.timeline])
  const rowKeys = useMemo(() => timeline.map((_, idx) => idx), [timeline])

  const selectedCount = useMemo(() => {
    if (!rowKeys.length) return 0
    let count = 0
    for (const idx of rowKeys) if (selected[idx]) count += 1
    return count
  }, [rowKeys, selected])

  const allSelected = rowKeys.length > 0 && selectedCount === rowKeys.length
  const someSelected = selectedCount > 0 && !allSelected

  const toggleAll = () => {
    setSelected((prev) => {
      if (rowKeys.length === 0) return prev
      if (allSelected) return {}

      const next = { ...prev }
      for (const idx of rowKeys) next[idx] = true
      return next
    })
  }

  const toggleOne = (idx: number) => {
    setSelected((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  return (
    <ShopPageLayout
      title="Solde historique"
      subtitle="Relevé solde (commandes, avoirs, paiements…)."
      icon="cart"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <AccountSidebar active="solde" />

        <main className="lg:col-span-3">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={!isAuthenticated || !canUseSolde || isFetching}
                className="h-7 px-2.5 text-xs"
              >
                Actualiser
              </Button>
            </div>

            {!isAuthenticated && !isAuthLoading && (
              <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">
                  Connectez-vous pour accéder à votre historique solde.
                </p>
              </div>
            )}

            {isAuthenticated && !canUseSolde && !isAuthLoading && (
              <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">
                  Votre compte n’est pas autorisé au paiement par solde.
                </p>
              </div>
            )}

            {canUseSolde && (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[11px] h-7 px-2 rounded-md">
                    Plafond: {formatMAD(Number(statement?.contact?.plafond ?? 0), locale)}
                  </Badge>
                  <Badge variant="outline" className="text-[11px] h-7 px-2 rounded-md text-muted-foreground">
                    Initial: {formatMAD(Number(statement?.summary?.initialSolde ?? 0), locale)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[11px] h-7 px-2 rounded-md text-rose-700 border-rose-200 bg-rose-50"
                  >
                    Débit: {formatMAD(Number(statement?.summary?.debitTotal ?? 0), locale)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[11px] h-7 px-2 rounded-md text-emerald-700 border-emerald-200 bg-emerald-50"
                  >
                    Crédit: {formatMAD(Number(statement?.summary?.creditTotal ?? 0), locale)}
                  </Badge>
                  <Badge variant="outline" className="text-[11px] h-7 px-2 rounded-md">
                    Final: {formatMAD(Number(statement?.summary?.finalSolde ?? 0), locale)}
                  </Badge>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center justify-end gap-2">
                    <Badge variant="outline" className="h-7 px-2 text-[10px] rounded-sm">
                      Lignes: {timeline.length}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="h-7 px-2 text-[10px] rounded-sm text-muted-foreground"
                    >
                      Sélectionnées: {selectedCount}
                    </Badge>
                    {selectedCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => setSelected({})}
                      >
                        Effacer
                      </Button>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-background/95 backdrop-blur-sm overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-9 py-2.5">
                          <Checkbox
                            checked={allSelected ? true : someSelected ? "indeterminate" : false}
                            onCheckedChange={toggleAll}
                            aria-label="Sélectionner toutes les lignes"
                            className="size-3.5"
                          />
                        </TableHead>
                        <TableHead className="whitespace-nowrap py-2.5 text-[11px]">Source</TableHead>
                        <TableHead className="whitespace-nowrap py-2.5 text-[11px]">Date</TableHead>
                        <TableHead className="whitespace-nowrap py-2.5 text-[11px]">Réf</TableHead>
                        <TableHead className="whitespace-nowrap py-2.5 text-[11px]">Statut</TableHead>
                        <TableHead className="whitespace-nowrap py-2.5 text-[11px] text-right">Débit</TableHead>
                        <TableHead className="whitespace-nowrap py-2.5 text-[11px] text-right">Crédit</TableHead>
                        <TableHead className="whitespace-nowrap py-2.5 text-[11px] text-right">Δ</TableHead>
                        <TableHead className="whitespace-nowrap py-2.5 text-[11px] text-right">
                          Solde cumulé
                        </TableHead>
                        <TableHead className="whitespace-nowrap py-2.5 text-[11px]">Mode</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                            Chargement…
                          </TableCell>
                        </TableRow>
                      ) : timeline.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                            Aucun mouvement solde.
                          </TableCell>
                        </TableRow>
                      ) : (
                        timeline.map((row, idx) => {
                          const cfg = SOURCE_BADGE[row.source as SoldeStatementSource]
                          const checked = !!selected[idx]
                          const delta = Number(row.delta ?? 0)
                          const isPos = delta > 0
                          const isNeg = delta < 0

                          return (
                            <TableRow key={`${row.source}-${row.docId ?? "x"}-${idx}`}>
                              <TableCell className="w-9 py-2.5">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() => toggleOne(idx)}
                                  aria-label="Sélectionner la ligne"
                                  className="size-3.5"
                                />
                              </TableCell>

                              <TableCell className="whitespace-nowrap py-2.5">
                                <Badge
                                  variant="outline"
                                  className={cn("text-[10px] h-6 px-2 rounded-md", cfg?.className)}
                                >
                                  {cfg?.label ?? row.source}
                                </Badge>
                              </TableCell>

                              <TableCell className="whitespace-nowrap py-2.5 text-[11px] font-medium">
                                {row.date ? formatDate(row.date, locale) : "—"}
                              </TableCell>

                              <TableCell className="whitespace-nowrap py-2.5">
                                <div className="flex flex-col">
                                  <span className="text-[12px] font-semibold text-foreground">
                                    {row.ref ?? "—"}
                                  </span>
                                  {row.docId != null && (
                                    <span className="text-[10px] text-muted-foreground">ID: {row.docId}</span>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell className="whitespace-nowrap py-2.5 text-[11px] text-muted-foreground">
                                {row.statut ?? "—"}
                              </TableCell>

                              <TableCell className="whitespace-nowrap py-2.5 text-right">
                                {Number(row.debit ?? 0) > 0 ? (
                                  <span className="text-[12px] font-semibold text-rose-600">
                                    +{formatMAD(Number(row.debit ?? 0), locale)}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-muted-foreground">—</span>
                                )}
                              </TableCell>

                              <TableCell className="whitespace-nowrap py-2.5 text-right">
                                {Number(row.credit ?? 0) > 0 ? (
                                  <span className="text-[12px] font-semibold text-emerald-700">
                                    -{formatMAD(Number(row.credit ?? 0), locale)}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-muted-foreground">—</span>
                                )}
                              </TableCell>

                              <TableCell className="whitespace-nowrap py-2.5 text-right">
                                <span
                                  className={cn(
                                    "text-[12px] font-semibold",
                                    isPos && "text-rose-600",
                                    isNeg && "text-emerald-700",
                                    !isPos && !isNeg && "text-muted-foreground"
                                  )}
                                >
                                  {delta === 0
                                    ? "0"
                                    : isPos
                                      ? `+${formatMAD(delta, locale)}`
                                      : `-${formatMAD(Math.abs(delta), locale)}`}
                                </span>
                              </TableCell>

                              <TableCell className="whitespace-nowrap py-2.5 text-right">
                                <span className="text-[12px] font-bold text-foreground">
                                  {formatMAD(Number(row.soldeCumule ?? 0), locale)}
                                </span>
                              </TableCell>

                              <TableCell className="whitespace-nowrap py-2.5 text-[11px] text-muted-foreground">
                                {row.modePaiement ?? "—"}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ShopPageLayout>
  )
}

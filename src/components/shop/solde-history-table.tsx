"use client"

import { useMemo, useState } from "react"
import type { ColumnDef, SortingState } from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import type { OrderStatus, SoldeOrdersStatementResponse, SoldeStatementSource, SoldeStatementTimelineRow } from "@/types/order"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type SoldeHistoryRow = {
  key: string
  source: SoldeStatementSource
  date: string | null
  ref: string | null
  statut: string | null
  debit: number
  credit: number
  delta: number
  soldeCumule: number
}

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

function safeNumber(value: unknown) {
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

export function SoldeHistoryTable({
  statement,
  locale,
}: {
  statement: SoldeOrdersStatementResponse | undefined
  locale: string
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }])
  const [globalFilter, setGlobalFilter] = useState("")

  const rows = useMemo<SoldeHistoryRow[]>(() => {
    const timeline = statement?.timeline ?? []
    return timeline.map((r: SoldeStatementTimelineRow, idx: number) => ({
      key: `${r.source}-${r.docId ?? "x"}-${idx}`,
      source: r.source,
      date: r.date ?? null,
      ref: r.ref ?? null,
      statut: r.statut ?? null,
      debit: safeNumber(r.debit),
      credit: safeNumber(r.credit),
      delta: safeNumber(r.delta),
      soldeCumule: safeNumber(r.soldeCumule),
    }))
  }, [statement?.timeline])

  const columns = useMemo<ColumnDef<SoldeHistoryRow>[]>(
    () => [
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ row }) => {
          const cfg = SOURCE_BADGE[row.original.source]
          return (
            <Badge
              variant="outline"
              className={cn("text-[10px] h-6 px-2 rounded-md", cfg.className)}
            >
              {cfg.label}
            </Badge>
          )
        },
      },
      {
        accessorKey: "date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) =>
          row.original.date ? (
            <span className="text-[11px] font-medium">{formatDate(row.original.date, locale)}</span>
          ) : (
            <span className="text-[11px] text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "ref",
        header: "Référence",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-[12px] font-semibold text-foreground">
              {row.original.ref ?? "—"}
            </span>
            {row.original.source === "BON_ECOMMERCE" && (
              <span className="text-[10px] text-muted-foreground">Commande e‑commerce</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "statut",
        header: "Statut",
        cell: ({ row }) => (
          <span className="text-[11px] text-muted-foreground">{row.original.statut ?? "—"}</span>
        ),
      },
      {
        accessorKey: "debit",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="h-8 px-2 text-xs justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Débit
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {row.original.debit > 0 ? (
              <span className="text-[12px] font-semibold text-rose-600">
                +{formatMAD(row.original.debit, locale)}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">—</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "credit",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="h-8 px-2 text-xs justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Crédit
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            {row.original.credit > 0 ? (
              <span className="text-[12px] font-semibold text-emerald-600">
                -{formatMAD(row.original.credit, locale)}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">—</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "delta",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="h-8 px-2 text-xs justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Δ
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => {
          const v = row.original.delta
          const isPos = v > 0
          const isNeg = v < 0
          return (
            <div className="text-right">
              <span
                className={cn(
                  "text-[12px] font-semibold",
                  isPos && "text-rose-600",
                  isNeg && "text-emerald-700",
                  !isPos && !isNeg && "text-muted-foreground"
                )}
              >
                {v === 0 ? "0" : isPos ? `+${formatMAD(v, locale)}` : `-${formatMAD(Math.abs(v), locale)}`}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "soldeCumule",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="h-8 px-2 text-xs justify-end w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Solde cumulé
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            <span className="text-[12px] font-bold text-foreground">
              {formatMAD(row.original.soldeCumule, locale)}
            </span>
          </div>
        ),
      },
    ],
    [locale]
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue ?? "").trim().toLowerCase()
      if (!q) return true
      const ref = String(row.original.ref ?? "").toLowerCase()
      return ref.includes(q)
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const summary = statement?.summary

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="h-7 px-2 text-[10px] rounded-sm">
            Lignes: {table.getFilteredRowModel().rows.length}
          </Badge>
          {summary && (
            <>
              <Badge variant="outline" className="h-7 px-2 text-[10px] rounded-sm text-muted-foreground">
                Initial: {formatMAD(summary.initialSolde, locale)}
              </Badge>
              <Badge variant="outline" className="h-7 px-2 text-[10px] rounded-sm text-rose-700 border-rose-200 bg-rose-50">
                Débit: {formatMAD(summary.debitTotal, locale)}
              </Badge>
              <Badge variant="outline" className="h-7 px-2 text-[10px] rounded-sm text-emerald-700 border-emerald-200 bg-emerald-50">
                Crédit: {formatMAD(summary.creditTotal, locale)}
              </Badge>
              <Badge variant="outline" className="h-7 px-2 text-[10px] rounded-sm">
                Final: {formatMAD(summary.finalSolde, locale)}
              </Badge>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Suivant
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-background/95 backdrop-blur-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "text-xs",
                      (header.column.id === "debit" || header.column.id === "credit" || header.column.id === "delta" || header.column.id === "soldeCumule") && "text-right"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "py-2.5",
                        (cell.column.id === "debit" || cell.column.id === "credit" || cell.column.id === "delta" || cell.column.id === "soldeCumule") && "text-right"
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                  Aucun historique solde trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
        </span>
        <span>
          {table.getFilteredRowModel().rows.length} résultat{table.getFilteredRowModel().rows.length > 1 ? "s" : ""}
        </span>
      </div>
    </div>
  )
}

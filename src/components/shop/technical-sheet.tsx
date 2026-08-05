"use client"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { 
  FileText, 
  Package, 
  Layers, 
  Shield, 
  Ruler, 
  Box, 
  CheckCircle2,
  AlertTriangle,
  Grid3x3,
  Settings,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { useState } from "react"

type AnyRecord = Record<string, any>

interface TechnicalSheetProps {
  fiche?: string | AnyRecord | null
  className?: string
}

type ParsedMarkdownItem = { label: string; value: string }
type ParsedFiche =
  | { kind: "json"; data: AnyRecord }
  | { kind: "markdown"; items: ParsedMarkdownItem[] }

function normalizeMarkdownValue(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return "—"

  // Common artifact from some generators: doubled single quotes.
  // Example: l''unité -> l'unité
  const collapsedQuotes = trimmed.replace(/''/g, "'")
  return collapsedQuotes
}

function parseMarkdownFiche(input: string): ParsedMarkdownItem[] {
  const lines = input
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)

  const items: ParsedMarkdownItem[] = []

  for (const line of lines) {
    // Match: - **Label**: value (also supports *, • and __Label__)
    const boldMatch = line.match(
      /^(?:[-*•]\s*)?(?:\*\*(.+?)\*\*|__(.+?)__)\s*:\s*(.*)$/
    )
    if (boldMatch) {
      const label = (boldMatch[1] ?? boldMatch[2] ?? "").trim()
      const value = normalizeMarkdownValue(boldMatch[3] ?? "")
      if (label) items.push({ label, value })
      continue
    }

    // Fallback: - Label: value
    const plainMatch = line.match(/^(?:[-*•]\s*)?([^:]+?)\s*:\s*(.*)$/)
    if (plainMatch) {
      const label = (plainMatch[1] ?? "").trim()
      const value = normalizeMarkdownValue(plainMatch[2] ?? "")
      if (label) items.push({ label, value })
    }
  }

  // Deduplicate while preserving order (in case generator repeats fields)
  const seen = new Set<string>()
  return items.filter((it) => {
    const key = `${it.label.toLowerCase()}\u0000${it.value}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function parseFiche(fiche: string | AnyRecord | null | undefined): ParsedFiche | null {
  if (!fiche) return null

  if (typeof fiche !== "string") {
    return { kind: "json", data: fiche }
  }

  const raw = fiche.trim()
  if (!raw) return null

  // Try JSON first (legacy format)
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === "object") {
      return { kind: "json", data: parsed as AnyRecord }
    }
  } catch {
    // ignore
  }

  // Markdown bullet-list format
  const items = parseMarkdownFiche(raw)
  if (items.length === 0) return null
  return { kind: "markdown", items }
}

function formatValue(v: any): string {
  if (v === null || v === undefined || v === "") return "—"
  if (typeof v === "number") return String(v)
  if (Array.isArray(v)) {
    if (v.length === 0) return "—"
    return v.join(", ")
  }
  return String(v)
}

export function TechnicalSheet({ fiche, className }: TechnicalSheetProps) {
  const [activeTab, setActiveTab] = useState<string>("general")
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  const parsed = parseFiche(fiche)
  if (!parsed) return null

  // Markdown rendering: clean spec table.
  if (parsed.kind === "markdown") {
    return (
      <div className={cn("rounded-lg border bg-card", className)}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full px-4 py-4 sm:py-3 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Fiche technique</h3>
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {parsed.items.length}
            </Badge>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {isExpanded && (
          <div className="border-t border-border/40 p-4">
            <div className="rounded-lg border bg-muted/30">
              {/* Mobile: stacked spec list (more scannable, no horizontal table) */}
              <div className="sm:hidden divide-y divide-border/40">
                {parsed.items.map((item, idx) => (
                  <div key={`${item.label}-${idx}`} className="px-3 py-3">
                    <div className="text-xs font-medium text-foreground rtl:text-right">
                      {item.label}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap rtl:text-right">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop/tablet */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-2/5 text-xs text-left rtl:text-right">Caractéristique</TableHead>
                      <TableHead className="text-xs text-left rtl:text-right">Valeur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsed.items.map((item, idx) => (
                      <TableRow key={`${item.label}-${idx}`}>
                        <TableCell className="text-xs font-medium text-foreground align-top">
                          {item.label}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-pre-wrap">
                          {item.value}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const data = parsed.data

  const specs = (data?.specs ?? {}) as AnyRecord
  const section = (specs?.section_mm ?? {}) as AnyRecord
  const variants: AnyRecord[] = Array.isArray(data?.variants) ? data!.variants : []

  const tabs = [
    { id: "general", label: "Informations", icon: FileText },
    { id: "specs", label: "Spécifications", icon: Ruler },
    ...(variants.length > 0 ? [{ id: "variants", label: "Variantes", icon: Grid3x3 }] : []),
    { id: "usage", label: "Usage & Conformité", icon: Settings }
  ]

  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Fiche technique</h3>
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            v{formatValue(data?.version)}
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <>
          {/* Tabs */}
          <div className="border-t border-border/40">
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap border-b-2",
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {/* General Info Tab */}
            {activeTab === "general" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-start gap-2">
                    <Package className="w-3.5 h-3.5 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Désignation</p>
                      <p className="text-sm font-medium truncate">{formatValue(data?.designation)}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-start gap-2">
                    <Grid3x3 className="w-3.5 h-3.5 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Catégorie</p>
                      <p className="text-sm font-medium">{formatValue(data?.category)}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-start gap-2">
                    <Layers className="w-3.5 h-3.5 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Matériau</p>
                      <p className="text-sm font-medium">{formatValue(data?.material)}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-start gap-2">
                    <Shield className="w-3.5 h-3.5 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Traitement</p>
                      <p className="text-sm font-medium">{formatValue(data?.treatment)}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Classe de service</p>
                      <p className="text-sm font-medium">{formatValue(data?.service_class)}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-start gap-2">
                    <Box className="w-3.5 h-3.5 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Unité de base</p>
                      <p className="text-sm font-medium">{formatValue(data?.base_unit)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Specifications Tab */}
            {activeTab === "specs" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Section — largeur</p>
                    <p className="text-sm font-semibold">{formatValue(section?.width)} {section?.width && section?.width !== "—" ? "mm" : ""}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Section — hauteur</p>
                    <p className="text-sm font-semibold">{formatValue(section?.height)} {section?.height && section?.height !== "—" ? "mm" : ""}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Densité</p>
                    <p className="text-sm font-semibold">{formatValue(specs?.density_kg_m3)} {specs?.density_kg_m3 && specs?.density_kg_m3 !== "—" ? "kg/m³" : ""}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Humidité</p>
                    <p className="text-sm font-semibold">{formatValue(specs?.moisture_content_pct)} {specs?.moisture_content_pct && specs?.moisture_content_pct !== "—" ? "%" : ""}</p>
                  </div>
                </div>
                {specs?.length_notes && specs.length_notes !== "—" && (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Notes de longueur</p>
                    <p className="text-sm">{formatValue(specs?.length_notes)}</p>
                  </div>
                )}
                {specs?.surface_finish && specs.surface_finish !== "—" && (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Finition de surface</p>
                    <p className="text-sm">{formatValue(specs?.surface_finish)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Variants Tab */}
            {activeTab === "variants" && variants.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {variants.map((v, idx) => (
                  <div key={v.id || idx} className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {formatValue(v.name)}
                      </Badge>
                      {v.prix_vente && v.prix_vente !== "—" && (
                        <span className="text-xs font-bold text-primary">{formatValue(v.prix_vente)} MAD</span>
                      )}
                    </div>
                    <div className="space-y-0.5 text-xs text-muted-foreground">
                      {v.length_mm && v.length_mm !== "—" && (
                        <p>Longueur: {formatValue(v.length_mm)} mm</p>
                      )}
                      {v.reference && v.reference !== "—" && (
                        <p>Référence: {formatValue(v.reference)}</p>
                      )}
                      {v.stock_quantity && v.stock_quantity !== "—" && (
                        <p>Stock: {formatValue(v.stock_quantity)} unités</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Usage & Compliance Tab */}
            {activeTab === "usage" && (
              <div className="space-y-3">
                {/* Compliance */}
                {(data?.compliance?.notes || data?.compliance?.standards?.length > 0) && (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      <h4 className="text-xs font-semibold">Conformité</h4>
                    </div>
                    <div className="space-y-2 text-xs">
                      {data?.compliance?.standards && Array.isArray(data.compliance.standards) && data.compliance.standards.length > 0 && (
                        <div>
                          <span className="text-muted-foreground">Normes: </span>
                          <span>{formatValue(data.compliance.standards)}</span>
                        </div>
                      )}
                      {data?.compliance?.notes && data.compliance.notes !== "—" && (
                        <div>
                          <span className="text-muted-foreground">Notes: </span>
                          <span>{formatValue(data.compliance.notes)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Usage */}
                {(data?.usage?.recommended_applications || data?.usage?.indoor_outdoor || data?.usage?.precautions) && (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-primary" />
                      <h4 className="text-xs font-semibold">Usage</h4>
                    </div>
                    <div className="space-y-2 text-xs">
                      {data?.usage?.recommended_applications && (
                        <div>
                          <span className="text-muted-foreground">Applications: </span>
                          <span>{formatValue(data.usage.recommended_applications)}</span>
                        </div>
                      )}
                      {data?.usage?.indoor_outdoor && data.usage.indoor_outdoor !== "—" && (
                        <div>
                          <span className="text-muted-foreground">Intérieur/Extérieur: </span>
                          <span>{formatValue(data.usage.indoor_outdoor)}</span>
                        </div>
                      )}
                      {data?.usage?.precautions && data.usage.precautions !== "—" && (
                        <div>
                          <span className="text-muted-foreground">Précautions: </span>
                          <span>{formatValue(data.usage.precautions)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Packaging */}
                {(data?.packaging?.unit || data?.packaging?.palletization) && (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-3.5 h-3.5 text-primary" />
                      <h4 className="text-xs font-semibold">Conditionnement</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {data?.packaging?.unit && data.packaging.unit !== "—" && (
                        <div>
                          <span className="text-muted-foreground">Unité: </span>
                          <span>{formatValue(data.packaging.unit)}</span>
                        </div>
                      )}
                      {data?.packaging?.palletization && data.packaging.palletization !== "—" && (
                        <div>
                          <span className="text-muted-foreground">Palettisation: </span>
                          <span>{formatValue(data.packaging.palletization)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

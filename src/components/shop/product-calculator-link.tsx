"use client"

import Link from "next/link"
import { ArrowRight, Calculator } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { calculatorForProduct } from "@/lib/calculators/registry"

/**
 * Contextual « Calculer la quantité nécessaire » entry point. Rendered only
 * for products that map to a relevant calculator (never for tools, cutting
 * discs, electrical or plumbing items). Purchasing behaviour is untouched.
 */
export function ProductCalculatorLink({
  productId,
  designation,
  categoryId,
  parentCategoryId,
}: {
  productId: number | string
  designation?: string | null
  categoryId?: number | null
  parentCategoryId?: number | null
}) {
  const t = useTranslations("xp.product")
  const tc = useTranslations("xp.calc")
  const locale = useLocale()
  const match = calculatorForProduct({ designation, categoryId, parentCategoryId })
  if (!match) return null

  const params = new URLSearchParams({ ...match.prefill, product: String(productId) })
  return (
    <Link
      href={`/${locale}/calculateurs/${match.slug}?${params.toString()}`}
      className="group flex items-center gap-4 rounded-2xl border border-primary/30 bg-accent/60 p-4 transition-colors hover:border-primary"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold text-ink">
        <Calculator className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{t("calculate")}</span>
        <span className="block text-xs text-muted-foreground">
          {tc(`${match.slug}.title`)} · {t("calculateHint")}
        </span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-accent-text transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" aria-hidden="true" />
    </Link>
  )
}

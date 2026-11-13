import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { BudgetEstimator } from '@/components/tools/budget-estimator'
import { CalculatorView, type ProductContext } from '@/components/tools/calculator-view'
import { TOOL_ICONS } from '@/components/tools/tool-icons'
import { UnitConverter } from '@/components/tools/unit-converter'
import { normalizeLocale } from '@/i18n/locale'
import { API_CONFIG } from '@/lib/api-config'
import { ALL_TOOL_SLUGS, CALCULATORS, calculatorForProduct, getCalculator, type ToolSlug } from '@/lib/calculators/registry'
import { getLocalizedProductName } from '@/lib/localized-fields'
import { buildPageMetadata } from '@/lib/seo/metadata'

type Params = Promise<{ locale: string; slug: string }>
type Search = Promise<Record<string, string | string[] | undefined>>

function isToolSlug(slug: string): slug is ToolSlug {
  return (ALL_TOOL_SLUGS as string[]).includes(slug)
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = normalizeLocale(raw)
  if (!isToolSlug(slug)) return {}
  const t = await getTranslations({ locale, namespace: 'xp.calc' })
  return buildPageMetadata({ locale, path: `/calculateurs/${slug}`, title: t(`${slug}.metaTitle`), description: t(`${slug}.desc`) })
}

/** Units under which a catalog price is a price *per pack* (bag, pot, bucket…). */
const PER_PACK_UNITS = ['u', 'unite', 'unité', 'piece', 'pièce', 'sac', 'pot', 'seau', 'bidon']
/** Calculators whose price field is a per-pack price. */
const PACK_PRICED: Record<string, string> = {
  'colle-mortier': 'bagKg',
  'platre-enduit': 'bagKg',
  etancheite: 'packKg',
  peinture: 'containerL',
  beton: 'bagKg',
}

async function loadProductContext(id: string, slug: string, locale: string): Promise<{ ctx: ProductContext; prefill: Record<string, string> } | null> {
  if (!/^\d{1,9}$/.test(id)) return null
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}/api/ecommerce/products/${id}`, { cache: 'no-store', headers: { Platform: 'web' } })
    if (!res.ok) return null
    const p = await res.json()
    const name = getLocalizedProductName(p, locale) || p.designation
    const mapping = calculatorForProduct({ designation: p.designation, categoryId: p.categorie?.id, parentCategoryId: p.categorie?.parent_id })
    const prefill: Record<string, string> = mapping?.slug === slug ? { ...mapping.prefill } : {}
    const sizeKey = PACK_PRICED[slug]

    // Pack size: authoritative catalog weight first, then the product name.
    let pack: ProductContext['pack'] = null
    if (sizeKey === 'bagKg' || sizeKey === 'packKg') {
      if (typeof p.kg === 'number' && p.kg > 0) {
        prefill[sizeKey] = String(p.kg)
        pack = { value: `${p.kg} kg`, source: 'catalog' }
      } else if (prefill[sizeKey]) {
        pack = { value: `${prefill[sizeKey]} kg`, source: 'name' }
      }
    } else if (sizeKey === 'containerL' && prefill.containerL) {
      pack = { value: `${prefill.containerL} L`, source: 'name' }
    }

    const offer = typeof p.prix_promo === 'number' && p.prix_promo > 0 && p.prix_promo < p.prix_vente ? p.prix_promo : p.prix_vente
    const price = typeof offer === 'number' && offer > 0 ? offer : null
    const unit = String(p.base_unit ?? '').toLowerCase()
    const def = getCalculator(slug)
    // Only prefill a cost when the catalog price clearly corresponds to one pack.
    if (price !== null && pack && def?.priceKey && PER_PACK_UNITS.includes(unit)) prefill[def.priceKey] = String(price)

    return { ctx: { id: Number(p.id), name, price, pack }, prefill }
  } catch {
    return null
  }
}

export default async function CalculatorPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { locale: raw, slug } = await params
  const locale = normalizeLocale(raw)
  if (!isToolSlug(slug)) notFound()
  const sp = await searchParams
  const t = await getTranslations({ locale, namespace: 'xp.tools' })
  const tc = await getTranslations({ locale, namespace: 'xp.calc' })

  const flat: Record<string, string> = {}
  for (const [key, value] of Object.entries(sp)) if (typeof value === 'string' && key.length < 40) flat[key] = value.slice(0, 40)

  let product: ProductContext | null = null
  if (flat.product && getCalculator(slug)) {
    const loaded = await loadProductContext(flat.product, slug, locale)
    if (loaded) {
      product = loaded.ctx
      for (const [key, value] of Object.entries(loaded.prefill)) if (!(key in flat)) flat[key] = value
    }
  }

  const Icon = TOOL_ICONS[slug]
  const current = CALCULATORS.find((c) => c.slug === slug)
  const related = CALCULATORS.filter((c) => c.slug !== slug && (!current || c.family === current.family)).slice(0, 3)

  return (
    <div>
      <section className="relative isolate overflow-hidden border-b border-border bg-surface">
        <div className="bd-grid absolute inset-0 opacity-70" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1440px] px-4 pb-10 pt-8 sm:px-6 lg:px-10 lg:pb-12 lg:pt-12">
          <Link href={`/${locale}/calculateurs`} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
            {t('backToHub')}
          </Link>
          <div className="mt-6 flex items-start gap-5">
            <span className="hidden size-16 shrink-0 place-items-center rounded-2xl bg-ink text-brand-yellow sm:grid" data-reveal="scale">
              <Icon className="size-7" strokeWidth={1.5} aria-hidden="true" />
            </span>
            <div>
              <p className="kicker" data-reveal>{t('hubKicker')}</p>
              <h1 className="display-lg mt-2 text-4xl sm:text-5xl" data-reveal style={{ ['--reveal-delay' as string]: '80ms' }}>{tc(`${slug}.title`)}</h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground" data-reveal style={{ ['--reveal-delay' as string]: '160ms' }}>
                {tc(`${slug}.desc`)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="pt-8 lg:pt-10">
        {slug === 'budget' ? (
          <BudgetEstimator />
        ) : slug === 'convertisseur' ? (
          <UnitConverter />
        ) : (
          <CalculatorView slug={slug} initialParams={flat} product={product} />
        )}
      </div>

      {related.length ? (
        <section className="no-print mx-auto max-w-[1440px] px-4 pb-16 sm:px-6 lg:px-10" aria-labelledby="related-tools">
          <h2 id="related-tools" className="mb-5 text-xl font-bold">{t('related')}</h2>
          <ul className="grid gap-3 sm:grid-cols-3">
            {related.map((calc) => {
              const RelIcon = TOOL_ICONS[calc.slug]
              return (
                <li key={calc.slug}>
                  <Link href={`/${locale}/calculateurs/${calc.slug}`} className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/50">
                    <RelIcon className="size-5 text-accent-text" strokeWidth={1.6} aria-hidden="true" />
                    <span className="flex-1 text-sm font-semibold">{tc(`${calc.slug}.title`)}</span>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 rtl:rotate-180" aria-hidden="true" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

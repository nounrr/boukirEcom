"use client"

import Link from "next/link"
import { ArrowRight, LayoutGrid, Pause, Play } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useMemo, useState } from "react"

import { CategoryThumb, useCategoryCovers } from "@/components/layout/category-thumb"
import { MarqueeRow } from "@/components/ui/marquee-row"
import { Skeleton } from "@/components/ui/skeleton"
import { compareCategoryOrder } from "@/lib/category-order"
import { catalogHref } from "@/lib/catalog/registry"
import { getLocalizedCategoryName } from "@/lib/localized-fields"
import { useGetCategoriesQuery } from "@/state/api/categories-api-slice"
import type { Category } from "@/types/category"

/** Categories shown in the two rows (the first ones in the back-office order). */
const SHOWN = 32

/**
 * Section « Explorez par catégorie » : les rayons de la boutique sur deux lignes qui défilent
 * en continu, la 1re de droite à gauche, la 2e de gauche à droite. Seul le bouton pause
 * les arrête. Chaque carte ouvre le rayon.
 */
export function CategoriesRail() {
  const locale = useLocale()
  const t = useTranslations("storePage.categoriesRail")
  const { data: categories = [], isLoading } = useGetCategoriesQuery()

  const childrenMap = useMemo(() => {
    const map = new Map<number, Category[]>()
    for (const category of categories) {
      if (!category.parent_id) continue
      const list = map.get(category.parent_id) ?? []
      list.push(category)
      map.set(category.parent_id, list)
    }
    return map
  }, [categories])

  // The departments people shop: the sub-categories (leaves), in the back-office order;
  // when the catalogue has no sub-categories, the top-level ones.
  const shown = useMemo(() => {
    const label = (c: Category) => getLocalizedCategoryName(c as never, locale) || c.nom
    const leaves = categories.filter((c) => c.parent_id && !childrenMap.has(c.id))
    const pool = leaves.length >= 8 ? leaves : categories
    return pool.slice().sort((a, b) => compareCategoryOrder(a, b, label)).slice(0, SHOWN)
  }, [categories, childrenMap, locale])

  const coverOf = useCategoryCovers(shown, childrenMap, shown.length > 0)

  const [userPaused, setUserPaused] = useState(false)
  // Only the pause button stops the rows (hover and focus leave them moving).
  const paused = userPaused

  const rows = useMemo(() => [shown.filter((_, i) => i % 2 === 0), shown.filter((_, i) => i % 2 === 1)], [shown])

  if (!isLoading && shown.length === 0) return null

  return (
    <section className="py-10 lg:py-12" aria-labelledby="categories-rail-title">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="kicker flex items-center gap-2 !text-[var(--accent-text)]">
              <LayoutGrid className="size-3.5" aria-hidden="true" />{t("kicker")}
            </p>
            <h2 id="categories-rail-title" className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{t("title")}</h2>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/${locale}/categories`} className="group inline-flex h-11 shrink-0 items-center gap-2.5 rounded-full bg-gold ps-5 pe-1.5 text-sm font-bold text-ink shadow-[0_14px_30px_-14px_rgba(242,183,5,0.75)] ring-1 ring-black/5 transition-[translate,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-12px_rgba(242,183,5,0.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              <span>{t("seeAll")}</span>
              <span className="grid size-8 place-items-center rounded-full bg-ink text-brand-yellow transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setUserPaused((value) => !value)}
              aria-pressed={userPaused}
              aria-label={userPaused ? t("play") : t("pause")}
              className="grid size-10 place-items-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary/50 hover:text-accent-text motion-reduce:hidden"
            >
              {userPaused ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[0, 1].map((row) => (
              <div key={row} className="flex gap-3 overflow-hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-[76px] w-[230px] shrink-0 rounded-2xl" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div
            className="-mx-5 flex flex-col gap-3 sm:-mx-8 lg:mx-0"
          >
            {rows.map((row, index) => (
              <MarqueeRow
                key={index}
                label={t("rowLabel", { row: index + 1 })}
                reverse={index === 1}
                paused={paused}
                secondsPerItem={5.5}
                itemDir={locale === "ar" ? "rtl" : "ltr"}
                itemClassName="w-[220px] sm:w-[250px]"
                items={row.map((category) => {
                  const name = getLocalizedCategoryName(category as never, locale) || category.nom
                  return (
                    <Link
                      key={category.id}
                      href={catalogHref(locale, "categories", category.id)}
                      className="group flex h-[76px] items-center gap-3 rounded-2xl border border-border bg-card p-2.5 pe-4 transition-[border-color,box-shadow] duration-300 hover:border-primary/50 hover:shadow-[0_14px_30px_-24px_rgba(13,13,13,0.55)]"
                    >
                      <CategoryThumb category={category} label={name} cover={coverOf(category)} className="size-14" imgClassName="group-hover:scale-105" />
                      <span className="line-clamp-2 min-w-0 flex-1 text-[13px] font-semibold leading-snug text-foreground/90 group-hover:text-accent-text">{name}</span>
                      <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent-text rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
                    </Link>
                  )
                })}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

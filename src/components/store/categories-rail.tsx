"use client"

import Link from "next/link"
import { ArrowRight, LayoutGrid, Pause, Play } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useMemo, useState } from "react"

import { CategoryThumb, useCategoryCovers } from "@/components/layout/category-thumb"
import { MarqueeRow } from "@/components/ui/marquee-row"
import { Skeleton } from "@/components/ui/skeleton"
import { compareCategoryOrder } from "@/lib/category-order"
import { shopCategoryHref } from "@/lib/catalog/shop-href"
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
    <section className="py-14 lg:py-20" aria-labelledby="categories-rail-title">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="kicker flex items-center gap-2 !text-[var(--accent-text)]">
              <LayoutGrid className="size-3.5" aria-hidden="true" />{t("kicker")}
            </p>
            <h2 id="categories-rail-title" className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">{t("title")}</h2>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/${locale}/categories`} className="group inline-flex h-11 shrink-0 items-center gap-2.5 rounded-full bg-gold ps-5 pe-1.5 text-sm font-bold text-ink shadow-[0_14px_30px_-14px_rgba(242,183,5,0.75)] ring-1 ring-black/5 transition-[translate,box-shadow] duration-600 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-12px_rgba(242,183,5,0.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              <span>{t("seeAll")}</span>
              <span className="grid size-8 place-items-center rounded-full bg-ink text-brand-yellow transition-transform duration-600 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
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
          <div className="flex flex-col gap-4">
            {[0, 1].map((row) => (
              <div key={row} className="flex gap-3 overflow-hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-[260px] w-[200px] shrink-0 rounded-3xl sm:h-[300px] sm:w-[240px]" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div
            className="-mx-5 flex flex-col gap-4 sm:-mx-8 lg:mx-0"
          >
            {rows.map((row, index) => (
              <MarqueeRow
                key={index}
                label={t("rowLabel", { row: index + 1 })}
                reverse={index === 1}
                paused={paused}
                secondsPerItem={6}
                itemDir={locale === "ar" ? "rtl" : "ltr"}
                itemClassName="w-[200px] pr-4 sm:w-[240px] lg:w-[270px]"
                items={row.map((category) => {
                  const name = getLocalizedCategoryName(category as never, locale) || category.nom
                  return (
                    <Link
                      key={category.id}
                      href={shopCategoryHref(locale, category.id)}
                      className="group flex h-[260px] flex-col overflow-hidden rounded-3xl border border-border bg-card transition-[border-color,box-shadow,translate] duration-600 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_24px_44px_-26px_rgba(13,13,13,0.6)] sm:h-[300px] lg:h-[330px]"
                    >
                      <CategoryThumb category={category} label={name} cover={coverOf(category)} displayWidth={270} className="!size-auto min-h-0 w-full flex-1 !rounded-none text-5xl" imgClassName="group-hover:scale-105" />
                      <span className="flex items-center gap-2 p-4">
                      <span className="line-clamp-2 min-w-0 flex-1 text-[15px] font-bold leading-snug text-foreground/90 group-hover:text-accent-text">{name}</span>
                      <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent-text rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
                      </span>
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

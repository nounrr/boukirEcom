"use client"

import Link from "next/link"
import { ArrowRight, Pause, Play } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

import { MaalemDirectoryCard } from "@/components/maalems/maalem-directory-card"
import { MarqueeRow } from "@/components/ui/marquee-row"
import type { PublicMaalemsResponse } from "@/types/service-request"

type PublicMaalemSummary = PublicMaalemsResponse["maalems"][number]
import { SectionHeading } from "./section-heading"

/** From this many profiles the cards scroll by themselves; fewer are shown still (no repeats). */
const SCROLL_FROM = 4

/**
 * « Nos Maalems » on the homepage: the directory's profile cards, in a new random order on every
 * visit, scrolling continuously (pause button, can be dragged). Hidden when the directory is empty.
 */
export function FlagshipMaalems({ locale, maalems }: { locale: string; maalems: PublicMaalemSummary[] }) {
  const t = useTranslations("maalemsPage")
  const [paused, setPaused] = useState(false)
  // Random order once mounted (the server HTML keeps the API order, so both renders match).
  const [seed, setSeed] = useState<number | null>(null)
  useEffect(() => setSeed(Math.random()), [])
  const ordered = useMemo(() => {
    if (seed === null) return maalems
    const score = (id: number) => {
      const x = Math.sin(id * 12.9898 + seed * 7823.3) * 43758.5453
      return x - Math.floor(x)
    }
    return [...maalems].sort((a, b) => score(a.id) - score(b.id))
  }, [maalems, seed])

  if (maalems.length === 0) return null

  const labels = {
    verified: t("verified"), city: t("city"), areas: t("areas"), experience: t("experienceLabel", { years: "{years}" }),
    noPhoto: t("noPhoto"), interventions: t("interventionsLabel", { count: "{count}" }), declared: t("declared"),
    profile: t("profile"), request: t("request"), ratingLabel: t("ratingLabel", { rating: "{rating}", count: "{count}" }),
    verifiedReviews: t("verifiedReviews"), noReviews: t("noReviews"),
  }
  const card = (maalem: PublicMaalemSummary, index: number) => (
    <MaalemDirectoryCard key={maalem.id} maalem={maalem} locale={locale} stats={maalem.statistics} labels={labels} index={index} reveal={false} />
  )
  const scrolls = ordered.length >= SCROLL_FROM

  return (
    <section className="overflow-hidden bg-background pb-20 lg:pb-28" aria-labelledby="home-maalems-title">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <SectionHeading
          id="home-maalems-title"
          kicker={t("eyebrow")}
          title={`${t("title")} *${t("titleAccent")}*`}
          description={t("description")}
          action={
            <div className="flex items-center gap-3">
              <Link href={`/${locale}/maalems`} className="group inline-flex h-11 items-center gap-2.5 rounded-full bg-gold ps-5 pe-1.5 text-sm font-bold text-ink shadow-[0_14px_30px_-14px_rgba(242,183,5,0.8)] transition-transform duration-500 hover:-translate-y-0.5">
                {t("explore")}
                <span className="grid size-8 place-items-center rounded-full bg-ink text-brand-yellow transition-transform duration-500 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
                  <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
                </span>
              </Link>
              {scrolls ? (
                <button
                  type="button"
                  onClick={() => setPaused((value) => !value)}
                  aria-pressed={paused}
                  aria-label={paused ? t("play") : t("pause")}
                  className="grid size-11 place-items-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary/50 hover:text-accent-text motion-reduce:hidden"
                >
                  {paused ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
                </button>
              ) : null}
            </div>
          }
        />
      </div>
      <div className="mt-10">
        {scrolls ? (
          <MarqueeRow
            label={t("eyebrow")}
            paused={paused}
            secondsPerItem={6}
            itemDir={locale === "ar" ? "rtl" : "ltr"}
            itemClassName="w-[270px] pr-5 sm:w-[300px] [&>div]:h-full"
            items={ordered.map(card)}
          />
        ) : (
          <div className="mx-auto grid max-w-[1440px] gap-5 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:px-10">{ordered.map(card)}</div>
        )}
      </div>
    </section>
  )
}

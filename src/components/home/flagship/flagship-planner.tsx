"use client"

import Link from "next/link"
import { ArrowRight, ClipboardList, PencilRuler } from "lucide-react"
import { useTranslations } from "next-intl"
import { SectionHeading } from "./section-heading"

/** Scene 08 — Project Planner teaser, linking to the real /projet journey. */
export function FlagshipPlanner({ locale }: { locale: string }) {
  const t = useTranslations("xp.home.plannerTeaser")
  const tp = useTranslations("xp.planner")
  const steps = ["type", "dimensions", "materials", "calculate", "review", "action"] as const

  return (
    <section className="relative overflow-hidden bg-background py-20 lg:py-28" aria-labelledby="planner-title">
      <div className="bd-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(70%_60%_at_50%_40%,black,transparent)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <SectionHeading
          id="planner-title"
          kicker={t("kicker")}
          title={t("title")}
          description={t("desc")}
          action={
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Link href={`/${locale}/projet`} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-semibold text-ink">
                <ClipboardList className="size-4" aria-hidden="true" />
                {t("cta")}
              </Link>
              <Link href={`/${locale}/studio`} className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border px-6 text-sm font-semibold hover:border-foreground/40">
                <PencilRuler className="size-4" aria-hidden="true" />
                {t("cta2")}
              </Link>
            </div>
          }
        />
        <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {steps.map((step, index) => (
            <li key={step} data-reveal style={{ ["--reveal-delay" as string]: `${index * 80}ms` }}>
              <Link
                href={`/${locale}/projet`}
                className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[1.5rem] border border-border bg-surface p-5 transition-[transform,border-color] duration-500 hover:-translate-y-1 hover:border-primary/50 lg:min-h-[190px]"
              >
                <span className="text-4xl font-extrabold text-foreground/10 tabular transition-colors duration-500 group-hover:text-accent-text">{String(index + 1).padStart(2, "0")}</span>
                <span className="mt-8 flex items-center justify-between gap-2 text-sm font-semibold">
                  {tp(`steps.${step}`)}
                  <ArrowRight className="size-4 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 rtl:rotate-180" aria-hidden="true" />
                </span>
                <span className="absolute inset-x-5 bottom-0 h-0.5 origin-left scale-x-0 bg-gold transition-transform duration-500 group-hover:scale-x-100 rtl:origin-right" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

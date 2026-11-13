"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Maison / Professionnel — two cinematic panels. On desktop the hovered or
 * focused universe expands; both deep-link to the existing filtered store.
 */
export function FlagshipJourneys({ locale }: { locale: string }) {
  const t = useTranslations("home")
  const tx = useTranslations("xp.home.journeys")
  const [focus, setFocus] = useState<0 | 1 | null>(null)

  const panels = [
    { value: "Maison", title: t("utilityType.homeLabel"), desc: t("utilityType.homeDesc"), image: "/utility-types/maison-diy-editorial-2026.webp", position: "object-[62%_center]", tag: "01" },
    { value: "Professionel", title: t("utilityType.proLabel"), desc: t("utilityType.proDesc"), image: "/utility-types/professionnel-atelier-editorial-2026.webp", position: "object-[42%_center]", tag: "02" },
  ] as const

  return (
    <section className="bg-background pb-20 lg:pb-32" aria-labelledby="journeys-title">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="mb-10 flex flex-col justify-between gap-4 border-t border-border pt-10 md:flex-row md:items-end">
          <div>
            <p className="kicker" data-reveal>{tx("kicker")}</p>
            <h2 id="journeys-title" className="display-lg mt-3 max-w-xl text-3xl sm:text-4xl" data-reveal>{t("utilityType.title")}</h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground" data-reveal>{t("utilityType.desc")}</p>
        </div>

        <div className="flex flex-col gap-4 lg:h-[560px] lg:flex-row">
          {panels.map((panel, index) => (
            <Link
              key={panel.value}
              href={`/${locale}/shop?utility_type=${panel.value}`}
              onMouseEnter={() => setFocus(index as 0 | 1)}
              onMouseLeave={() => setFocus(null)}
              onFocus={() => setFocus(index as 0 | 1)}
              onBlur={() => setFocus(null)}
              data-reveal
              style={{ ["--reveal-delay" as string]: `${index * 120}ms` }}
              className={cn(
                "group relative isolate flex min-h-[340px] overflow-hidden rounded-[2rem] bg-ink text-white outline-none transition-[flex-grow] duration-[900ms] ease-[var(--ease-premium)] focus-visible:ring-4 focus-visible:ring-brand-orange/50 lg:min-h-0",
                focus === null ? "lg:flex-[1]" : focus === index ? "lg:flex-[1.55]" : "lg:flex-[0.75]"
              )}
            >
              <Image src={panel.image} alt="" fill sizes="(min-width:1024px) 60vw, 100vw" className={cn("-z-10 object-cover transition-transform duration-[1.6s] ease-[var(--ease-premium)] group-hover:scale-105", panel.position)} />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/45 to-ink/10" />
              <div className="flex w-full flex-col justify-between p-7 sm:p-9">
                <span className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                  <span className="text-brand-yellow">{panel.tag}</span>
                  <span className="h-px w-8 bg-brand-orange" />
                  {tx("kicker").split("·").pop()?.trim()}
                </span>
                <div>
                  <h3 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{panel.title}</h3>
                  <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/75">{panel.desc}</p>
                  <span className="mt-6 inline-flex items-center gap-3 text-sm font-semibold">
                    <span className="grid size-11 place-items-center rounded-full border border-white/30 transition-colors duration-300 group-hover:border-brand-orange group-hover:bg-brand-orange group-hover:text-ink">
                      <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
                    </span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

'use client'

import { ArrowRight, BadgeCheck, Wrench } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { toAbsoluteImageUrl } from '@/lib/image-url'
import {
  localizedCategoryName,
  localizedServiceText,
  serviceDetailHref,
  serviceRequestHref,
} from '@/lib/service-catalog'
import type { PublicService } from '@/types/service-request'

interface ServiceCardProps {
  service: PublicService
  locale: string
  viewLabel: string
  requestLabel: string
  moreCategoriesLabel: string
}

export function ServiceCard({
  service,
  locale,
  viewLabel,
  requestLabel,
  moreCategoriesLabel,
}: ServiceCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const { name, description } = localizedServiceText(service, locale)
  const imageUrl = imageFailed ? null : toAbsoluteImageUrl(service.image_url)
  const extraCategories = Math.max(0, service.categories.length - 2)

  return (
    // La carte entiere est cliquable via le lien etire du titre (after:inset-0).
    // Le bouton de demande repasse au-dessus avec `relative z-10`.
    // Cadre fixe qui reçoit le survol ; seule la carte se soulève (pas de tremblement au bord).
    <div className="group relative flex min-h-full min-w-0">
    <article
      className="relative flex w-full min-w-0 flex-1 flex-col rounded-[26px] border border-black/[0.06] bg-card p-3
        shadow-[0_6px_20px_-14px_rgba(16,24,40,.28)]
        transition-[transform,translate,scale,rotate,box-shadow,border-color] duration-[700ms] ease-hover will-change-transform
        group-hover:-translate-y-1.5 group-hover:border-primary/45 group-hover:shadow-[0_30px_60px_-30px_rgba(13,13,13,0.45),0_0_0_1px_rgba(242,159,4,0.15)]
        focus-within:-translate-y-1.5 focus-within:border-primary/45
        motion-reduce:transform-none motion-reduce:transition-none
        dark:border-white/10 dark:shadow-[0_6px_20px_-14px_rgba(0,0,0,.6)]
        dark:group-hover:border-primary/45 dark:group-hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9),0_0_0_1px_rgba(242,159,4,0.25)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-ink">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
            className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-slow)] group-hover:scale-[1.07] motion-reduce:transform-none"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div
            className="bd-grid absolute inset-0 flex items-center justify-center bg-ink [--grid-color:rgba(255,255,255,0.05)]"
            role="img"
            aria-label={name}
          >
            <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-yellow shadow-[0_18px_40px_-14px_rgba(242,183,5,0.8)]">
              <Wrench className="size-8 text-ink" aria-hidden="true" />
            </span>
          </div>
        )}

        <span className="pointer-events-none absolute inset-y-0 -start-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-[inset-inline-start,opacity] duration-[1400ms] ease-[var(--ease-slow)] group-hover:start-[120%] group-hover:opacity-100" aria-hidden="true" />
        {service.categories.length > 0 && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-1.5">
            {service.categories.slice(0, 2).map((category) => (
              <span
                key={category.id}
                className="max-w-full truncate rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-ink shadow-sm backdrop-blur-sm dark:bg-ink/85 dark:text-brand-yellow"
              >
                {localizedCategoryName(category, locale)}
              </span>
            ))}
            {extraCategories > 0 && (
              <span className="rounded-full bg-black/45 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                {moreCategoriesLabel}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col px-2 pb-1 pt-4 sm:px-3">
        <h2 className="flex min-w-0 items-start gap-1.5 break-words text-[17px] font-semibold leading-snug text-foreground transition-colors duration-600 group-hover:text-accent-text sm:text-lg">
          <Link
            href={serviceDetailHref(locale, service.id)}
            aria-label={`${name} — ${viewLabel}`}
            className="min-w-0 break-words rounded-sm outline-none after:absolute after:inset-0 after:content-[''] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {name}
          </Link>
          {/* Le catalogue public n'expose que des services valides et publies. */}
          <BadgeCheck
            className="mt-0.5 size-[18px] shrink-0 fill-primary text-card"
            aria-hidden="true"
          />
        </h2>

        <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground transition-colors duration-600 group-hover:text-foreground/70">
          {description}
        </p>

        <div className="mt-auto flex min-w-0 flex-wrap items-center justify-between gap-3 pt-5">
          {/* Repris du lien etire du titre : decoratif, deja annonce par aria-label. */}
          <span
            className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs font-medium text-muted-foreground transition-colors duration-600 group-hover:text-accent-text"
            aria-hidden="true"
          >
            {viewLabel}
            <ArrowRight className="size-3.5 shrink-0 transition-transform duration-600 group-hover:translate-x-0.5 motion-reduce:transform-none rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
          </span>

          <Button
            asChild
            className="relative z-10 h-auto min-h-9 max-w-full min-w-0 whitespace-normal rounded-full bg-gold px-4 py-2 text-center font-bold text-ink shadow-[0_12px_26px_-12px_rgba(242,159,4,0.9)] transition-transform duration-500
              hover:-translate-y-0.5"
          >
            <Link href={serviceRequestHref(locale, service.id)}>
              {requestLabel}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
    </div>
  )
}

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
    <article
      className="group relative flex min-h-full flex-col rounded-[26px] border border-black/[0.06] bg-card p-3
        shadow-[0_6px_20px_-14px_rgba(16,24,40,.28)]
        transition-[transform,box-shadow,border-color] duration-300 ease-out
        hover:-translate-y-1 hover:border-black/10 hover:shadow-[0_28px_52px_-24px_rgba(16,24,40,.45)]
        focus-within:-translate-y-1 focus-within:border-black/10 focus-within:shadow-[0_28px_52px_-24px_rgba(16,24,40,.45)]
        motion-reduce:transform-none motion-reduce:transition-none
        dark:border-white/10 dark:shadow-[0_6px_20px_-14px_rgba(0,0,0,.6)]
        dark:hover:border-white/20 dark:hover:shadow-[0_28px_52px_-24px_rgba(0,0,0,.75)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-emerald-950">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transform-none"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-900 to-emerald-950"
            role="img"
            aria-label={name}
          >
            <span className="flex size-16 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/15">
              <Wrench className="size-8 text-amber-300" aria-hidden="true" />
            </span>
          </div>
        )}

        {service.categories.length > 0 && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-1.5">
            {service.categories.slice(0, 2).map((category) => (
              <span
                key={category.id}
                className="max-w-full truncate rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-emerald-950 shadow-sm backdrop-blur-sm dark:bg-emerald-950/85 dark:text-amber-200"
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

      <div className="flex flex-1 flex-col px-2 pb-1 pt-4 sm:px-3">
        <h2 className="flex items-start gap-1.5 text-[17px] font-semibold leading-snug text-foreground transition-colors duration-300 group-hover:text-emerald-900 dark:group-hover:text-emerald-300 sm:text-lg">
          <Link
            href={serviceDetailHref(locale, service.id)}
            aria-label={`${name} — ${viewLabel}`}
            className="rounded-sm outline-none after:absolute after:inset-0 after:content-[''] focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
          >
            {name}
          </Link>
          {/* Le catalogue public n'expose que des services valides et publies. */}
          <BadgeCheck
            className="mt-0.5 size-[18px] shrink-0 fill-emerald-600 text-card dark:fill-emerald-500 dark:text-card"
            aria-hidden="true"
          />
        </h2>

        <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground transition-colors duration-300 group-hover:text-foreground/70">
          {description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          {/* Repris du lien etire du titre : decoratif, deja annonce par aria-label. */}
          <span
            className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs font-medium text-muted-foreground transition-colors duration-300 group-hover:text-emerald-900 dark:group-hover:text-emerald-300"
            aria-hidden="true"
          >
            {viewLabel}
            <ArrowRight className="size-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transform-none rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
          </span>

          <Button
            asChild
            className="relative z-10 h-9 shrink-0 rounded-full bg-amber-400 px-4 text-emerald-950 shadow-none transition-all duration-300
              hover:bg-amber-300 hover:shadow-[0_10px_20px_-10px_rgba(180,120,10,.7)]
              group-hover:bg-amber-300
              dark:bg-amber-400 dark:text-emerald-950 dark:hover:bg-amber-300"
          >
            <Link href={serviceRequestHref(locale, service.id)}>
              {requestLabel}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}

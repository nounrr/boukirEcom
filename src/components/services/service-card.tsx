'use client'

import { ArrowRight, ImageIcon } from 'lucide-react'
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
    <article className="group flex min-h-full flex-col overflow-hidden border border-border/80 bg-card shadow-[0_14px_38px_-30px_rgba(49,42,31,0.5)] transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_22px_48px_-30px_rgba(49,42,31,0.65)] focus-within:border-primary/50">
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-[1.035]"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,hsl(var(--muted)),hsl(var(--card)))]" role="img" aria-label={name}>
            <ImageIcon className="size-10 text-muted-foreground/60" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/25 to-transparent" aria-hidden="true" />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex min-h-7 flex-wrap items-center gap-1.5">
          {service.categories.slice(0, 2).map((category) => (
            <span key={category.id} className="border border-primary/15 bg-primary/7 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
              {localizedCategoryName(category, locale)}
            </span>
          ))}
          {extraCategories > 0 && (
            <span className="text-xs font-medium text-muted-foreground">{moreCategoriesLabel}</span>
          )}
        </div>

        <h2 className="mt-4 text-xl font-bold leading-tight tracking-tight text-foreground sm:text-[1.35rem]">{name}</h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{description}</p>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
          <Button asChild variant="outline" className="h-auto min-h-10 whitespace-normal px-3 text-center leading-4">
            <Link href={serviceDetailHref(locale, service.id)}>{viewLabel}</Link>
          </Button>
          <Button asChild className="h-auto min-h-10 whitespace-normal px-3 text-center leading-4">
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

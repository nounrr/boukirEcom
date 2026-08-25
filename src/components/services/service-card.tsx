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
    <article className="group flex min-h-full flex-col overflow-hidden rounded-[14px] border border-stone-200/90 bg-card shadow-[0_16px_40px_-34px_rgba(41,37,32,0.55)] transition motion-safe:duration-300 motion-safe:hover:-translate-y-0.5 hover:border-amber-400/60 hover:shadow-[0_20px_45px_-34px_rgba(41,37,32,0.7)] focus-within:border-amber-500 dark:border-border">
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
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex min-h-7 flex-wrap items-center gap-1.5">
          {service.categories.slice(0, 2).map((category) => (
            <span key={category.id} className="rounded-[3px] bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
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
          <Button asChild variant="outline" className="h-auto min-h-11 whitespace-normal rounded-[6px] px-3 text-center leading-4">
            <Link href={serviceDetailHref(locale, service.id)}>{viewLabel}</Link>
          </Button>
          <Button asChild className="h-auto min-h-11 whitespace-normal rounded-[6px] px-3 text-center leading-4">
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

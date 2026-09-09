'use client'

import { ArrowRight, Wrench } from 'lucide-react'
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
    <article className="group flex min-h-full flex-col overflow-hidden rounded-2xl border border-amber-900/10 bg-card shadow-[0_10px_28px_-18px_rgba(83,60,19,.32)] transition-shadow hover:shadow-[0_18px_40px_-20px_rgba(83,60,19,.38)] dark:border-border">
      <div className={`relative overflow-hidden bg-emerald-950 ${imageUrl ? 'aspect-[3/2]' : 'h-40'}`}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
            className="object-cover transition duration-500 "
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-900 to-emerald-950" role="img" aria-label={name}>
            <span className="flex size-16 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/15"><Wrench className="size-8 text-amber-300" aria-hidden="true" /></span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex min-h-5 flex-wrap items-center gap-x-3 gap-y-1">
          {service.categories.slice(0, 2).map((category) => (
            <span key={category.id} className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              {localizedCategoryName(category, locale)}
            </span>
          ))}
          {extraCategories > 0 && (
            <span className="text-xs font-medium text-muted-foreground">{moreCategoriesLabel}</span>
          )}
        </div>

        <h2 className="mt-3 text-xl font-semibold leading-snug text-foreground sm:text-2xl"><Link href={serviceDetailHref(locale, service.id)} className="rounded-sm outline-none hover:underline hover:underline-offset-4 focus-visible:ring-2 focus-visible:ring-emerald-700">{name}</Link></h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{description}</p>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
          <Button asChild variant="outline" className="h-auto min-h-11 whitespace-normal rounded-lg border-emerald-900/15 px-3 text-center text-emerald-900 dark:border-border dark:text-emerald-300">
            <Link href={serviceDetailHref(locale, service.id)}>{viewLabel}</Link>
          </Button>
          <Button asChild className="h-auto min-h-11 whitespace-normal rounded-lg px-3 text-center bg-amber-400 text-emerald-950 hover:bg-amber-300 dark:bg-amber-400 dark:text-emerald-950 dark:hover:bg-amber-300">
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

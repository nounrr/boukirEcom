'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { normalizeLocale } from '@/i18n/locale'

type UtilityType = 'Maison' | 'Professionel'

function buildShopHref(locale: string, utilityType: UtilityType): string {
  const params = new URLSearchParams({ utility_type: utilityType })
  return `/${locale}/shop?${params.toString()}`
}

export function HomeUtilityTypeSelector({
  locale,
  className,
}: {
  locale?: string
  className?: string
}) {
  const t = useTranslations('home')
  const detectedLocale = useLocale()
  const activeLocale = normalizeLocale(locale ?? detectedLocale)

  const items: Array<{
    value: UtilityType
    imageSrc: string
    title: string
    description: string
  }> = [
    {
      value: 'Maison',
      imageSrc: '/utility-types/home-diy-workshop.webp',
      title: t.has('utilityType.homeLabel') ? t('utilityType.homeLabel') : 'Maison',
      description: t.has('utilityType.homeDesc')
        ? t('utilityType.homeDesc')
        : 'Produits pour la maison et le bricolage.',
    },
    {
      value: 'Professionel',
      imageSrc: '/utility-types/professional-workshop.webp',
      title: t.has('utilityType.proLabel') ? t('utilityType.proLabel') : 'Professionel',
      description: t.has('utilityType.proDesc') ? t('utilityType.proDesc') : 'Outillage et fournitures pour les pros.',
    },
  ]

  return (
    <section className={cn('pt-10 pb-12', className)}>
      <div className="container mx-auto px-6 sm:px-8 lg:px-16">
        <div className="mb-8">
          <div className="mx-auto h-px w-full max-w-5xl bg-linear-to-r from-transparent via-border/70 to-transparent" />
        </div>

        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center gap-2 rounded-full border border-border/40 bg-card/60 px-4 py-2 backdrop-blur-sm">
            <span className="text-xs font-medium text-muted-foreground">
              {t.has('utilityType.kicker') ? t('utilityType.kicker') : 'Par usage'}
            </span>
          </div>

          <h2 className="mt-4 text-xl sm:text-2xl font-bold text-foreground">
            {t.has('utilityType.title') ? t('utilityType.title') : 'Maison ou Professionel ?'}
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {t.has('utilityType.desc') ? t('utilityType.desc') : 'Filtrez la boutique en un clic et trouvez plus vite.'}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => {
            const href = buildShopHref(activeLocale, item.value)

            return (
              <Link
                key={item.value}
                href={href}
                className={cn(
                  'group relative block h-[224px] overflow-hidden rounded-3xl border border-white/15 bg-black shadow-lg outline-none md:h-[276px]',
                  'motion-safe:transition-[transform,box-shadow,border-color] motion-safe:duration-500 motion-safe:ease-out',
                  'hover:border-primary/55 hover:shadow-[0_22px_55px_-25px_rgba(0,0,0,0.8)] motion-safe:hover:-translate-y-1',
                  'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                )}
              >
                <Image
                  src={item.imageSrc}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out group-hover:scale-[1.045] group-focus-visible:scale-[1.045]"
                />

                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-linear-to-b from-black/35 via-black/50 to-black/75 transition-colors duration-500 group-hover:from-black/45 group-hover:via-black/55 group-focus-visible:from-black/45 group-focus-visible:via-black/55"
                />

                <div className="relative z-10 flex h-full items-center justify-center px-16 py-8 sm:px-20">
                  <div className="max-w-sm text-center text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]">
                    <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">{item.title}</h3>
                    <p className="mx-auto mt-2 max-w-[32ch] text-sm leading-relaxed text-white/85 sm:text-base">
                      {item.description}
                    </p>
                  </div>
                </div>

                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full',
                    'border border-white/45 bg-primary text-primary-foreground shadow-[0_8px_30px_-10px_rgba(245,158,11,0.9)]',
                    'motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out group-hover:translate-x-1 group-focus-visible:translate-x-1 sm:right-5 sm:h-12 sm:w-12'
                  )}
                >
                  <ArrowRight className="h-5 w-5" strokeWidth={2.25} />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

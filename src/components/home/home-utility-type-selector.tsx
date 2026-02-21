'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
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
      imageSrc: '/utility-types/home.png',
      title: t.has('utilityType.homeLabel') ? t('utilityType.homeLabel') : 'Maison',
      description: t.has('utilityType.homeDesc')
        ? t('utilityType.homeDesc')
        : 'Produits pour la maison et le bricolage.',
    },
    {
      value: 'Professionel',
      imageSrc: '/utility-types/pro.png',
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
                  'group block rounded-3xl border border-border/40 bg-card/60 backdrop-blur-sm',
                  'p-4 sm:p-6 transition-colors hover:bg-card'
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border/40 bg-primary/5">
                      <Image
                        src={item.imageSrc}
                        alt=""
                        width={32}
                        height={32}
                        sizes="32px"
                        className="h-8 w-8"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 w-9 p-0 rounded-full shrink-0"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <span className="text-base leading-none" aria-hidden="true">
                      →
                    </span>
                  </Button>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

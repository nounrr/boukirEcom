'use client'

import { BadgePercent, ShieldCheck, Truck, Headphones } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'
import { normalizeLocale } from '@/i18n/locale'

export function HomeTrustBar({
  locale,
  className,
}: {
  locale?: string
  className?: string
}) {
  const t = useTranslations('home')
  const detectedLocale = useLocale()
  const activeLocale = normalizeLocale(locale ?? detectedLocale)
  const isRtl = activeLocale === 'ar'

  const items = [
    {
      key: 'delivery',
      Icon: Truck,
      title: t('trustBar.deliveryTitle'),
      desc: t('trustBar.deliveryDesc'),
    },
    {
      key: 'secure',
      Icon: ShieldCheck,
      title: t('trustBar.securePaymentTitle'),
      desc: t('trustBar.securePaymentDesc'),
    },
    {
      key: 'support',
      Icon: Headphones,
      title: t('trustBar.supportTitle'),
      desc: t('trustBar.supportDesc'),
    },
    {
      key: 'remise',
      Icon: BadgePercent,
      title: t('trustBar.remiseTitle'),
      desc: t('trustBar.remiseDesc'),
    },
  ]

  return (
    <section className={cn('w-full', className)} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-6 sm:px-8 lg:px-16">
        <div className="grid grid-cols-1 gap-3 rounded-3xl border border-border/40 bg-background/70 p-4 backdrop-blur-sm sm:grid-cols-2 sm:gap-4 sm:p-5 lg:grid-cols-4">
          {items.map(({ key, Icon, title, desc }) => (
            <div key={key} className="flex items-start gap-3 rounded-2xl bg-card/50 p-3 sm:p-4">
              <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-[13px]">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

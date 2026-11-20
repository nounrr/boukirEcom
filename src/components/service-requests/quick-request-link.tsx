import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { quickServiceRequestHref } from '@/lib/service-catalog'

export async function QuickRequestLink({ locale, returnTo, className = '' }: {
  locale: string
  returnTo: string
  className?: string
}) {
  const t = await getTranslations({ locale, namespace: 'quickRequestNavigation' })
  return (
    <Link
      href={quickServiceRequestHref(locale, returnTo)}
      className={`group inline-flex min-h-12 max-w-full items-center gap-2.5 rounded-full bg-gold ps-6 pe-1.5 py-1.5 text-sm font-bold text-ink shadow-[0_14px_30px_-14px_rgba(242,183,5,0.8)] transition-transform duration-500 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${className}`}
    >
      <span>{t('label')}</span>
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-brand-yellow transition-transform duration-500 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
        <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
      </span>
    </Link>
  )
}

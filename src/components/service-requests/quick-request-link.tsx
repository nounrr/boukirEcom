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
      className={`inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-emerald-800/20 bg-white px-4 py-2 text-sm font-medium text-emerald-900 transition hover:border-emerald-800/40 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/40 dark:border-emerald-400/30 dark:bg-transparent dark:text-emerald-300 dark:hover:bg-emerald-950/40 ${className}`}
    >
      <span>{t('label')}</span>
      <ArrowRight className="size-4 shrink-0 rtl:rotate-180" aria-hidden="true" />
    </Link>
  )
}

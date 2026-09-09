"use client"

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import type { ServiceRequest } from '@/types/service-request'

interface Props {
  request: ServiceRequest
  locale: string
  subjectName?: string
}

export function RequestConfirmation({ request, locale, subjectName }: Props) {
  const t = useTranslations('serviceRequests')
  return (
    <section aria-live="polite" className="mx-auto my-10 max-w-xl border-y bg-background px-5 py-10 sm:my-16 sm:px-8 sm:py-12">
      <CheckCircle2 className="h-8 w-8 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
      <h1 className="mt-6 text-3xl font-medium">{t('success.title')}</h1>
      <p className="mt-4 leading-7 text-muted-foreground">{t('success.description')}</p>
      {subjectName && <p className="mt-4 text-sm">{t('form.serviceEyebrow')}: <span className="font-semibold text-foreground">{subjectName}</span></p>}
      <div className="mt-8 border-y py-5">
        <p className="text-sm text-muted-foreground">{t('success.requestNumber')}</p>
        <p className="mt-2 break-words text-2xl font-medium tabular-nums text-foreground">{request.request_number}</p>
      </div>
      <Button asChild className="mt-7 h-auto min-h-11 whitespace-normal rounded-md bg-emerald-700 px-5 py-3 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700"><Link href={`/${locale}/profile/requests/${request.id}`}>{t('success.tracking')}</Link></Button>
      <p className="mt-3 text-xs text-muted-foreground">{t('success.trackingHint')}</p>
    </section>
  )
}

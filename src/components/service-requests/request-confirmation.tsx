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
    <section aria-live="polite" className="mx-auto max-w-xl rounded-2xl border border-emerald-200 bg-card p-6 text-center shadow-sm sm:p-10 dark:border-emerald-900">
      <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" aria-hidden="true" />
      <h1 className="mt-5 text-2xl font-bold">{t('success.title')}</h1>
      <p className="mt-3 text-muted-foreground">{t('success.description')}</p>
      {subjectName && <p className="mt-4 text-sm">{t('form.serviceEyebrow')}: <span className="font-semibold text-foreground">{subjectName}</span></p>}
      <div className="mx-auto mt-6 max-w-xs rounded-xl bg-primary/10 px-5 py-4">
        <p className="text-sm text-muted-foreground">{t('success.requestNumber')}</p>
        <p className="mt-1 text-2xl font-bold tracking-wide text-primary">{request.request_number}</p>
      </div>
      <Button asChild className="mt-7"><Link href={`/${locale}/profile/requests/${request.id}`}>{t('success.tracking')}</Link></Button>
      <p className="mt-3 text-xs text-muted-foreground">{t('success.trackingHint')}</p>
    </section>
  )
}

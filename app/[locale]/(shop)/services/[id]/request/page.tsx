"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { ServiceRequestForm } from '@/components/service-requests/service-request-form'
import { ServiceSummary } from '@/components/service-requests/service-summary'
import { Button } from '@/components/ui/button'
import { getActiveService } from '@/lib/service-requests'
import type { PublicService } from '@/types/service-request'

export default function SelectedServiceRequestPage() {
  const locale = useLocale()
  const t = useTranslations('serviceRequests.form')
  const catalogue = useTranslations('servicesPage')
  const params = useParams<{ id: string }>()
  const serviceId = Number(params.id)
  const [service, setService] = useState<PublicService | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!Number.isSafeInteger(serviceId) || serviceId <= 0) {
      setError(t('serviceUnavailable'))
      return
    }
    let cancelled = false
    getActiveService(serviceId)
      .then((result) => {
        if (!cancelled) setService(result)
      })
      .catch(() => {
        if (!cancelled) setError(t('serviceUnavailable'))
      })
    return () => { cancelled = true }
  }, [serviceId, t])

  if (error) {
    return (
      <section className="mx-auto my-10 max-w-lg border-y px-5 py-12 sm:my-16 sm:px-8">
        <AlertCircle className="h-7 w-7 text-destructive" />
        <h1 className="mt-5 text-3xl font-medium">{t('serviceUnavailable')}</h1>
        <p className="mt-3 text-muted-foreground">{error}</p>
        <Button asChild className="mt-7 min-h-11 rounded-md bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700"><Link href={`/${locale}/services`}>{catalogue('filters.reset')}</Link></Button>
      </section>
    )
  }

  if (!service) {
    return <div className="flex min-h-72 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  const serviceName = (locale === 'ar' ? service.nom_ar : service.nom) || service.nom
  return (
    <ServiceRequestForm
      context={{ mode: 'selected_service', serviceId: service.id, serviceName }}
      eyebrow={t('serviceEyebrow')}
      title={t('serviceTitle')}
      description={t('serviceIntro')}
      backHref={`/${locale}/services`}
      summary={<ServiceSummary service={service} locale={locale} />}
    />
  )
}

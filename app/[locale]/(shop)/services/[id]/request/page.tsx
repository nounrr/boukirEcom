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
      <section className="mx-auto max-w-lg px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-5 text-2xl font-bold">{t('serviceUnavailable')}</h1>
        <p className="mt-3 text-muted-foreground">{error}</p>
        <Button asChild className="mt-6"><Link href={`/${locale}/services`}>{catalogue('filters.reset')}</Link></Button>
      </section>
    )
  }

  if (!service) {
    return <div className="flex min-h-72 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
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

"use client"

import { useLocale, useTranslations } from 'next-intl'
import { ServiceRequestForm } from '@/components/service-requests/service-request-form'

export default function QuickServiceRequestPage() {
  const locale = useLocale()
  const t = useTranslations('serviceRequests.form')
  return (
    <ServiceRequestForm
      context={{ mode: 'quick_request' }}
      eyebrow={t('quickEyebrow')}
      title={t('quickTitle')}
      description={t('quickIntro')}
      backHref={`/${locale}/services`}
    />
  )
}

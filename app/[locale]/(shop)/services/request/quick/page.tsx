"use client"

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ServiceRequestForm } from '@/components/service-requests/service-request-form'
import { quickServiceRequestReturnHref } from '@/lib/service-catalog'

export default function QuickServiceRequestPage() {
  const locale = useLocale()
  const t = useTranslations('serviceRequests.form')
  const [backHref, setBackHref] = useState(`/${locale}/services`)

  useEffect(() => {
    const returnTo = new URLSearchParams(window.location.search).get('returnTo')
    setBackHref(quickServiceRequestReturnHref(locale, returnTo, window.location.origin))
  }, [locale])

  return (
    <ServiceRequestForm
      context={{ mode: 'quick_request' }}
      eyebrow={t('quickEyebrow')}
      title={t('quickTitle')}
      description={t('quickIntro')}
      backHref={backHref}
    />
  )
}

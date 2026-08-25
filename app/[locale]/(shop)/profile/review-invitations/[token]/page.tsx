'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { AlertCircle, Clock3, Loader2, LogIn, Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { resolveReviewInvitation, ServiceRequestApiError } from '@/lib/service-requests'
import { useAppSelector } from '@/state/hooks'

type ResolutionError = 'expired' | 'suspended' | 'notFound' | 'unavailable' | null

export default function ReviewInvitationPage() {
  const locale = useLocale()
  const t = useTranslations('serviceRequests.reviewInvitation')
  const params = useParams()
  const router = useRouter()
  const { accessToken, isAuthenticated } = useAppSelector((state) => state.user)
  const [error, setError] = useState<ResolutionError>(null)
  const token = typeof params.token === 'string' ? params.token : ''

  useEffect(() => {
    if (!accessToken || !token) return
    let cancelled = false
    resolveReviewInvitation(token, accessToken)
      .then((result) => {
        if (!cancelled) router.replace(`/${locale}/profile/requests/${result.request.id}?review=1`)
      })
      .catch((reason) => {
        if (cancelled) return
        if (reason instanceof ServiceRequestApiError && reason.status === 410) setError('expired')
        else if (reason instanceof ServiceRequestApiError && reason.errorType === 'INVITATION_SUSPENDED') setError('suspended')
        else if (reason instanceof ServiceRequestApiError && reason.status === 404) setError('notFound')
        else setError('unavailable')
      })
    return () => { cancelled = true }
  }, [accessToken, locale, router, token])

  const callbackUrl = `/${locale}/profile/review-invitations/${encodeURIComponent(token)}`

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center px-4 py-12">
      {!isAuthenticated && !accessToken ? (
        <section className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><LogIn className="size-6" /></span>
          <h1 className="mt-4 text-xl font-bold">{t('authTitle')}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t('authDescription')}</p>
          <Button asChild className="mt-5"><Link href={`/${locale}/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>{t('login')}</Link></Button>
        </section>
      ) : error ? (
        <section className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            {error === 'expired' ? <Clock3 className="size-6" /> : <AlertCircle className="size-6" />}
          </span>
          <h1 className="mt-4 text-xl font-bold">{t(`${error}Title`)}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t(`${error}Description`)}</p>
          <Button asChild variant="outline" className="mt-5"><Link href={`/${locale}/profile/requests`}>{t('backToRequests')}</Link></Button>
        </section>
      ) : (
        <section className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm" aria-live="polite">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Star className="size-6" /></span>
          <h1 className="mt-4 text-xl font-bold">{t('loadingTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('loadingDescription')}</p>
          <Loader2 className="mx-auto mt-5 size-6 animate-spin text-primary" />
        </section>
      )}
    </div>
  )
}

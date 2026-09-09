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
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center px-5 py-12 sm:py-20">
      {!isAuthenticated && !accessToken ? (
        <section className="w-full rounded-3xl border border-amber-200/70 bg-[#fffcf5] p-7 text-center shadow-[0_18px_50px_-30px_rgba(85,62,20,.35)] sm:p-10 dark:border-border dark:bg-card">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"><LogIn className="size-6" /></span>
          <h1 className="mt-6 text-3xl font-bold leading-tight">{t('authTitle')}</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted-foreground">{t('authDescription')}</p>
          <Button asChild className="mt-6 min-h-11 rounded-md"><Link href={`/${locale}/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>{t('login')}</Link></Button>
        </section>
      ) : error ? (
        <section className="w-full border-y border-border py-10 text-start sm:py-12">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            {error === 'expired' ? <Clock3 className="size-6" /> : <AlertCircle className="size-6" />}
          </span>
          <h1 className="mt-6 text-3xl font-bold leading-tight">{t(`${error}Title`)}</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">{t(`${error}Description`)}</p>
          <Button asChild variant="outline" className="mt-6 min-h-11 rounded-md"><Link href={`/${locale}/profile/requests`}>{t('backToRequests')}</Link></Button>
        </section>
      ) : (
        <section className="w-full border-y border-border py-10 text-start sm:py-12" aria-live="polite">
          <span className="flex size-8 items-center text-emerald-800 dark:text-emerald-300"><Star className="size-6" /></span>
          <h1 className="mt-6 text-3xl font-bold leading-tight">{t('loadingTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('loadingDescription')}</p>
          <Loader2 className="mx-auto mt-6 size-6 animate-spin text-emerald-800 dark:text-emerald-300" />
        </section>
      )}
    </div>
  )
}

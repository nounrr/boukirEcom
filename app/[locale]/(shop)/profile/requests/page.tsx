'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, Check, ClipboardList, Copy, LogIn, MapPin, RefreshCw } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { AccountSidebar } from '@/components/account/account-sidebar'
import { Button } from '@/components/ui/button'
import { requestState } from '@/lib/request-status'
import { localizedRequestNames, quickServiceRequestHref } from '@/lib/service-catalog'
import { getMyServiceRequests } from '@/lib/service-requests'
import { useAppSelector } from '@/state/hooks'
import type { ServiceRequest } from '@/types/service-request'

/** "12 nov. 2026" — a date-only value (YYYY-MM-DD) is read as a local day, not UTC midnight. */
function shortDate(locale: string, value?: string | null) {
  if (!value) return null
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value)
  if (Number.isNaN(parsed.getTime())) return null
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(parsed)
}

/** Copies the request number; sits above the card link so it does not open the request. */
function CopyNumber({ value, label, done }: { value: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(timer)
  }, [copied])
  return (
    <button
      type="button"
      aria-label={copied ? done : label}
      title={copied ? done : label}
      onClick={() => void navigator.clipboard?.writeText(value).then(() => setCopied(true), () => undefined)}
      className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
    </button>
  )
}

/**
 * "Mes demandes" — the same screen as the app: a title, "Nouvelle demande", then one compact card per request
 * (number, status, service, description, city and date). The whole card opens the request.
 */
export default function MyServiceRequestsPage() {
  const locale = useLocale()
  const t = useTranslations('serviceRequests.tracking')
  const { accessToken } = useAppSelector((state) => state.user)
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(Boolean(accessToken))
  const [hasError, setHasError] = useState(false)

  const load = useCallback((token: string, isCancelled: () => boolean = () => false) => {
    setLoading(true)
    setHasError(false)
    getMyServiceRequests(token)
      .then((result) => { if (!isCancelled()) setRequests(result) })
      .catch(() => { if (!isCancelled()) setHasError(true) })
      .finally(() => { if (!isCancelled()) setLoading(false) })
  }, [])

  useEffect(() => {
    if (!accessToken) { setLoading(false); return }
    let cancelled = false
    load(accessToken, () => cancelled)
    return () => { cancelled = true }
  }, [accessToken, load])

  const title = (request: ServiceRequest) => {
    const { service } = localizedRequestNames(request, locale)
    return service || request.maalem_name || t(`source.${request.request_source}`) || t('requestFallback')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8" dir={locale === 'ar' ? 'rtl' : undefined}>
      <div className="grid gap-8 lg:grid-cols-4 lg:gap-10">
        <AccountSidebar active="requests" />

        <main className="min-w-0 lg:col-span-3">
          <header className="mb-6 space-y-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground rtl:tracking-normal">{t('listTitle')}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t('listSubtitle')}</p>
            </div>
            {accessToken && (
              <Button asChild variant="secondary" className="min-h-11 w-full gap-2 rounded-xl sm:w-auto">
                <Link href={quickServiceRequestHref(locale)}><ClipboardList className="size-4" />{t('newRequest')}</Link>
              </Button>
            )}
          </header>

          {!accessToken ? (
            <EmptyState icon={<LogIn className="size-7" />} title={t('authTitle')} text={t('authDescription')} action={t('login')} href={`/${locale}/login`} />
          ) : loading ? (
            <div className="space-y-3" role="status" aria-label={t('loading')}>
              {[0, 1].map((i) => <div key={i} className="h-[110px] animate-pulse rounded-2xl bg-muted" />)}
            </div>
          ) : hasError ? (
            <div className="rounded-2xl bg-destructive/5 px-6 py-8 text-center">
              <p className="text-sm font-medium text-destructive">{t('loadError')}</p>
              <Button variant="outline" className="mt-4 gap-2" onClick={() => load(accessToken)}><RefreshCw className="size-4" />{t('retry')}</Button>
            </div>
          ) : requests.length === 0 ? (
            <EmptyState icon={<ClipboardList className="size-7" />} title={t('emptyTitle')} text={t('emptyDescription')} action={t('emptyAction')} href={`/${locale}/services`} />
          ) : (
            <ul className="space-y-3">
              {requests.map((request) => {
                const state = requestState(request.status)
                const color = state?.color ?? '#8E8E93'
                const wished = shortDate(locale, request.desired_date)
                const sent = shortDate(locale, request.created_at)
                return (
                  <li key={request.id} className="relative flex flex-col gap-1.5 rounded-2xl border-s-4 bg-card p-4 shadow-[0_8px_28px_-20px_rgba(85,62,20,.35)] transition-shadow hover:shadow-md" style={{ borderInlineStartColor: color }}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <Link href={`/${locale}/profile/requests/${request.id}`} className="truncate text-base font-semibold text-foreground after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring">
                          {request.request_number}
                        </Link>
                        <CopyNumber value={request.request_number} label={t('copy')} done={t('copied')} />
                      </div>
                      <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium" style={{ color, backgroundColor: `${color}22` }}>
                        {state ? t(`state.${state.key}`) : request.status}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-400">{title(request)}</p>
                    {request.problem_description && <p className="line-clamp-2 text-sm text-muted-foreground">{request.problem_description}</p>}
                    <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {request.city && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{request.city}</span>}
                      {(wished || sent) && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="size-3" />
                          {wished ? t('wishedOn', { date: wished }) : t('sentOn', { date: sent ?? '' })}
                        </span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </main>
      </div>
    </div>
  )
}

function EmptyState({ icon, title, text, action, href }: { icon: React.ReactNode; title: string; text: string; action: string; href: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">{icon}</div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{text}</p>
      <Button asChild className="mt-5 min-h-11 rounded-xl"><Link href={href}>{action}</Link></Button>
    </div>
  )
}

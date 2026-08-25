'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Loader2,
  LogIn,
  MapPin,
  Plus,
  RefreshCw,
  Wrench,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { AccountSidebar } from '@/components/account/account-sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getServiceRequestStatusPresentation } from '@/lib/service-request-display'
import { getMyServiceRequestNotifications, getMyServiceRequests, markServiceRequestNotificationRead } from '@/lib/service-requests'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/state/hooks'
import type { OperationalNotification, ServiceRequest } from '@/types/service-request'

function formatDate(locale: string, value?: string | null, includeTime = false) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(parsed)
}

function formatDesiredDate(locale: string, value?: string | null) {
  if (!value) return null
  return formatDate(locale, value.includes('T') ? value : `${value}T00:00:00`)
}

export default function MyServiceRequestsPage() {
  const locale = useLocale()
  const t = useTranslations('serviceRequests.tracking')
  const isArabic = locale === 'ar'
  const { accessToken, isAuthenticated } = useAppSelector((state) => state.user)
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [notifications, setNotifications] = useState<OperationalNotification[]>([])
  const [loading, setLoading] = useState(Boolean(accessToken))
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!accessToken) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setHasError(false)
    Promise.all([getMyServiceRequests(accessToken), getMyServiceRequestNotifications(accessToken)])
      .then(([requestResult, notificationResult]) => {
        if (!cancelled) {
          setRequests(requestResult)
          setNotifications(notificationResult)
        }
      })
      .catch(() => {
        if (!cancelled) setHasError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [accessToken])

  const sourceLabel = (source: ServiceRequest['request_source']) => t(`source.${source}`)

  const requestTitle = (request: ServiceRequest) => {
    const localizedService = isArabic
      ? request.service_name_ar || request.service_name
      : request.service_name || request.service_name_ar
    const localizedCategory = isArabic
      ? request.category_name_ar || request.category_name
      : request.category_name || request.category_name_ar

    if (request.title) return request.title
    if (localizedService) return localizedService
    if (request.maalem_name) return t('maalemRequestTitle', { name: request.maalem_name })
    if (localizedCategory) return localizedCategory
    return t('requestFallback')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" dir={isArabic ? 'rtl' : undefined}>
      <div className="grid gap-6 lg:grid-cols-4">
        <AccountSidebar active="requests" />

        <main className="min-w-0 lg:col-span-3">
          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('listTitle')}</h1>
                {!loading && isAuthenticated && (
                  <Badge variant="secondary" className="font-semibold">
                    {t('count', { count: requests.length })}
                  </Badge>
                )}
              </div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t('listSubtitle')}</p>
            </div>
            {isAuthenticated && (
              <Button asChild className="shrink-0 gap-2">
                <Link href={`/${locale}/services`}>
                  <Plus className="size-4" />
                  {t('newRequest')}
                </Link>
              </Button>
            )}
          </header>

          {!loading && isAuthenticated && notifications.length > 0 && (
            <section className="mb-6 overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3 sm:px-5">
                <h2 className="flex items-center gap-2 font-semibold"><Bell className="size-4 text-primary" />{isArabic ? 'آخر الإشعارات' : 'Dernières notifications'}</h2>
                <Badge variant="secondary">{notifications.filter((item) => !item.read_at).length}</Badge>
              </div>
              <div className="divide-y">{notifications.slice(0, 8).map((item) => (
                <article key={item.id} className={cn('block w-full px-4 py-3 text-start sm:px-5', !item.read_at && 'bg-primary/5')}>
                  <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 whitespace-pre-line text-xs leading-5 text-muted-foreground">{item.body}</p></div>{!item.read_at && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />}</div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] text-muted-foreground">{formatDate(locale, item.created_at, true)}</p>
                    {item.action_url ? (
                      <a href={item.action_url} onClick={() => {
                        if (!accessToken || item.read_at) return
                        void markServiceRequestNotificationRead(item.id, accessToken).then(() => setNotifications((current) => current.map((notification) => notification.id === item.id ? { ...notification, read_at: new Date().toISOString() } : notification)))
                      }} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                        {item.cta_label || (isArabic ? 'إضافة تقييم' : 'Donner mon avis')} <ArrowUpRight className="size-3.5" />
                      </a>
                    ) : !item.read_at ? (
                      <button type="button" onClick={() => {
                        if (!accessToken) return
                        void markServiceRequestNotificationRead(item.id, accessToken).then(() => setNotifications((current) => current.map((notification) => notification.id === item.id ? { ...notification, read_at: new Date().toISOString() } : notification)))
                      }} className="text-xs font-medium text-primary hover:underline">{isArabic ? 'تحديد كمقروء' : 'Marquer comme lu'}</button>
                    ) : null}
                  </div>
                </article>
              ))}</div>
            </section>
          )}

          {!isAuthenticated && !accessToken ? (
            <section className="rounded-2xl border bg-card px-6 py-10 text-center shadow-sm">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <LogIn className="size-6" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">{t('authTitle')}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t('authDescription')}</p>
              <Button asChild className="mt-5">
                <Link href={`/${locale}/login`}>{t('login')}</Link>
              </Button>
            </section>
          ) : loading ? (
            <div className="space-y-4" aria-label={t('loading')} aria-live="polite">
              {[1, 2, 3].map((item) => (
                <div key={item} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                  <div className="h-20 animate-pulse border-b bg-muted/50" />
                  <div className="space-y-3 p-5">
                    <div className="h-5 w-2/5 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : hasError ? (
            <section className="rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-8 text-center">
              <p className="text-sm font-medium text-destructive">{t('loadError')}</p>
              <Button variant="outline" className="mt-4 gap-2" onClick={() => window.location.reload()}>
                <RefreshCw className="size-4" />
                {t('retry')}
              </Button>
            </section>
          ) : requests.length === 0 ? (
            <section className="rounded-2xl border bg-card px-6 py-12 text-center shadow-sm">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <ClipboardList className="size-7" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">{t('emptyTitle')}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t('emptyDescription')}</p>
              <Button asChild variant="outline" className="mt-5 gap-2">
                <Link href={`/${locale}/services`}>
                  <Wrench className="size-4" />
                  {t('emptyAction')}
                </Link>
              </Button>
            </section>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const status = getServiceRequestStatusPresentation(request.status)
                const createdAt = formatDate(locale, request.created_at, true)
                const desiredDate = formatDesiredDate(locale, request.desired_date)

                return (
                  <article
                    key={request.id}
                    className={cn(
                      'overflow-hidden rounded-2xl border border-s-4 bg-card shadow-sm transition-shadow hover:shadow-md',
                      status.accent,
                    )}
                  >
                    <div className="border-b border-border/40 bg-muted/30 px-4 py-3 sm:px-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                          <span className="text-muted-foreground">
                            {t('createdLabel')} <strong className="font-medium text-foreground">{createdAt || t('notProvided')}</strong>
                          </span>
                          <span className="text-muted-foreground">
                            {t('numberLabel')} <strong className="font-semibold text-foreground">{request.request_number}</strong>
                          </span>
                          <span className="text-muted-foreground">
                            {t('sourceLabel')} <strong className="font-medium text-foreground">{sourceLabel(request.request_source)}</strong>
                          </span>
                        </div>
                        <Badge variant="outline" className={cn('w-fit shrink-0', status.background, status.border, status.color)}>
                          {t(`status.${status.key}`)}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{sourceLabel(request.request_source)}</p>
                          <h2 className="mt-1 text-lg font-bold text-foreground">{requestTitle(request)}</h2>
                          <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                            {request.problem_description || t('descriptionFallback')}
                          </p>
                        </div>
                        <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5 self-start">
                          <Link href={`/${locale}/profile/requests/${request.id}`}>
                            {t('viewDetails')}
                            {isArabic ? <ArrowUpRight className="size-4" /> : <ChevronRight className="size-4" />}
                          </Link>
                        </Button>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-border/40 pt-4 text-xs text-muted-foreground">
                        {request.city && (
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <MapPin className="size-4 shrink-0 text-primary" />
                            <span className="truncate">{request.city}</span>
                          </span>
                        )}
                        {(desiredDate || request.desired_time_slot) && (
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <CalendarDays className="size-4 shrink-0 text-primary" />
                            <span className="truncate">
                              {[desiredDate, request.desired_time_slot].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                        )}
                      </div>

                      <div className={cn('mt-4 rounded-lg border px-3 py-2 text-xs font-medium', status.background, status.border, status.color)}>
                        {t(`statusMessage.${status.key}`)}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

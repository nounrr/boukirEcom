'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Circle,
  ClipboardList,
  Clock3,
  Download,
  ExternalLink,
  FileIcon,
  FileImage,
  Loader2,
  LogIn,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  RefreshCw,
  UserRound,
  Wrench,
} from 'lucide-react'

import { AccountSidebar } from '@/components/account/account-sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getServiceRequestStatusPresentation } from '@/lib/service-request-display'
import {
  downloadServiceRequestAttachment,
  getServiceRequestDetails,
  ServiceRequestApiError,
} from '@/lib/service-requests'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/state/hooks'
import type { ServiceRequest, ServiceRequestAttachment, ServiceRequestDetails } from '@/types/service-request'

type ErrorKey = 'notFound' | 'loadError' | null

function formatDateTime(locale: string, value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatDesiredDate(locale: string, value?: string | null) {
  if (!value) return null
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatFileSize(locale: string, bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = units[0]
  for (let index = 1; value >= 1024 && index < units.length; index += 1) {
    value /= 1024
    unit = units[index]
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)} ${unit}`
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}

function SectionCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-2xl border bg-card p-4 shadow-sm sm:p-5', className)}>
      <div className="mb-4 flex items-center gap-2 border-b border-border/40 pb-3">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export default function ServiceRequestTrackingPage() {
  const locale = useLocale()
  const t = useTranslations('serviceRequests.tracking')
  const params = useParams()
  const isArabic = locale === 'ar'
  const { accessToken, isAuthenticated } = useAppSelector((state) => state.user)
  const [details, setDetails] = useState<ServiceRequestDetails | null>(null)
  const [errorKey, setErrorKey] = useState<ErrorKey>(null)
  const [loading, setLoading] = useState(Boolean(accessToken))
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [downloadError, setDownloadError] = useState<number | null>(null)
  const requestId = Number(params.id)

  useEffect(() => {
    if (!accessToken) {
      setLoading(false)
      return
    }
    if (!Number.isSafeInteger(requestId) || requestId <= 0) {
      setErrorKey('notFound')
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setErrorKey(null)
    getServiceRequestDetails(requestId, accessToken)
      .then((result) => {
        if (!cancelled) setDetails(result)
      })
      .catch((reason) => {
        if (!cancelled) {
          setErrorKey(reason instanceof ServiceRequestApiError && reason.status === 404 ? 'notFound' : 'loadError')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [accessToken, requestId])

  const request = details?.request
  const status = getServiceRequestStatusPresentation(request?.status || '')
  const workflowSteps = useMemo(
    () => [
      t('workflow.received'),
      t('workflow.review'),
      t('workflow.assignment'),
      t('workflow.intervention'),
      t('workflow.completed'),
    ],
    [t],
  )

  const handleDownload = async (attachment: ServiceRequestAttachment) => {
    if (!accessToken || !request) return
    setDownloadingId(attachment.id)
    setDownloadError(null)
    try {
      await downloadServiceRequestAttachment(request.id, attachment.id, attachment.original_name, accessToken)
    } catch {
      setDownloadError(attachment.id)
    } finally {
      setDownloadingId(null)
    }
  }

  const getLocalizedValue = (primary?: string | null, arabic?: string | null) =>
    (isArabic ? arabic || primary : primary || arabic) || null

  const getRequestTitle = (value: ServiceRequest) =>
    value.title
    || getLocalizedValue(value.service_name, value.service_name_ar)
    || (value.maalem_name ? t('maalemRequestTitle', { name: value.maalem_name }) : null)
    || getLocalizedValue(value.category_name, value.category_name_ar)
    || t('requestFallback')

  const BackIcon = isArabic ? ArrowRight : ArrowLeft

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" dir={isArabic ? 'rtl' : undefined}>
      <div className="grid gap-6 lg:grid-cols-4">
        <AccountSidebar active="requests" />

        <main className="min-w-0 lg:col-span-3">
          <Link
            href={`/${locale}/profile/requests`}
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <BackIcon className="size-4" />
            {t('backToList')}
          </Link>

          {!isAuthenticated && !accessToken ? (
            <section className="rounded-2xl border bg-card px-6 py-10 text-center shadow-sm">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <LogIn className="size-6" />
              </div>
              <h1 className="mt-4 text-lg font-semibold">{t('authTitle')}</h1>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t('authDescription')}</p>
              <Button asChild className="mt-5">
                <Link href={`/${locale}/login`}>{t('login')}</Link>
              </Button>
            </section>
          ) : loading ? (
            <div className="space-y-4" aria-label={t('loading')} aria-live="polite">
              <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="h-24 animate-pulse border-b bg-muted/50" />
                <div className="grid grid-cols-5 gap-3 p-5">
                  {workflowSteps.map((step) => <div key={step} className="h-12 animate-pulse rounded-lg bg-muted" />)}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl border bg-muted/40" />)}
              </div>
            </div>
          ) : errorKey || !request || !details ? (
            <section className="rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-10 text-center">
              <AlertCircle className="mx-auto size-9 text-destructive" />
              <h1 className="mt-4 text-lg font-semibold text-foreground">{t(errorKey || 'loadError')}</h1>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                {t(errorKey === 'notFound' ? 'notFoundDescription' : 'loadErrorDescription')}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button asChild variant="outline">
                  <Link href={`/${locale}/profile/requests`}>{t('backToList')}</Link>
                </Button>
                {errorKey !== 'notFound' && (
                  <Button className="gap-2" onClick={() => window.location.reload()}>
                    <RefreshCw className="size-4" />
                    {t('retry')}
                  </Button>
                )}
              </div>
            </section>
          ) : (
            <div className="space-y-4">
              <section className={cn('overflow-hidden rounded-2xl border border-s-4 bg-card shadow-sm', status.accent)}>
                <div className="border-b border-border/40 bg-muted/30 px-4 py-4 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t('detailEyebrow')}</p>
                      <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{request.request_number}</h1>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{t('sourceLabel')} <strong className="font-medium text-foreground">{t(`source.${request.request_source}`)}</strong></span>
                        <span>{t('createdLabel')} <strong className="font-medium text-foreground">{formatDateTime(locale, request.created_at) || t('notProvided')}</strong></span>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn('w-fit shrink-0 px-3 py-1 text-sm', status.background, status.border, status.color)}>
                      {t(`status.${status.key}`)}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-5 gap-1 sm:gap-3" aria-label={t('workflow.label')}>
                    {workflowSteps.map((step, index) => {
                      const isComplete = !status.terminal && status.progressIndex > index
                      const isCurrent = !status.terminal && status.progressIndex === index
                      return (
                        <div key={step} className="relative flex min-w-0 flex-col items-center text-center">
                          {index > 0 && (
                            <span className={cn('absolute end-1/2 top-3 h-0.5 w-full -translate-y-1/2', isComplete || isCurrent ? 'bg-primary/45' : 'bg-border')} />
                          )}
                          <span
                            className={cn(
                              'relative z-10 flex size-6 items-center justify-center rounded-full border bg-card',
                              isComplete && 'border-primary bg-primary text-primary-foreground',
                              isCurrent && status.border,
                            )}
                          >
                            {isComplete ? (
                              <Check className="size-3.5" />
                            ) : isCurrent ? (
                              <span className={cn('size-2 rounded-full', status.color.replace('text-', 'bg-'))} />
                            ) : (
                              <Circle className="size-2.5 text-muted-foreground/45" />
                            )}
                          </span>
                          <span className={cn('mt-2 line-clamp-2 text-[10px] leading-tight sm:text-xs', isCurrent || isComplete ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                            {step}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <p className="mt-4 text-center text-xs text-muted-foreground">{t('workflow.hint')}</p>
                  <div className={cn('mt-4 rounded-xl border px-4 py-3', status.background, status.border)}>
                    <p className={cn('text-sm font-semibold', status.color)}>{t(`statusMessage.${status.key}`)}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{t('teamMessage')}</p>
                  </div>
                </div>
              </section>

              <div className="grid gap-4 xl:grid-cols-2">
                <SectionCard icon={ClipboardList} title={t('needSection')} className="xl:col-span-2">
                  <h2 className="text-lg font-bold text-foreground">{getRequestTitle(request)}</h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/85">
                    {request.problem_description || t('descriptionFallback')}
                  </p>
                </SectionCard>

                <SectionCard icon={Wrench} title={t('serviceSection')}>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <DetailField label={t('serviceLabel')} value={getLocalizedValue(request.service_name, request.service_name_ar) || t('notProvided')} />
                    <DetailField
                      label={t('maalemLabel')}
                      value={request.maalem_name || (request.requested_maalem_id ? t('idFallback', { id: request.requested_maalem_id }) : t('notProvided'))}
                    />
                    <DetailField label={t('categoryLabel')} value={getLocalizedValue(request.category_name, request.category_name_ar) || t('notProvided')} />
                    <DetailField label={t('sourceLabel')} value={t(`source.${request.request_source}`)} />
                  </dl>
                </SectionCard>

                <SectionCard icon={UserRound} title={t('requesterSection')}>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <DetailField label={t('nameLabel')} value={request.requester_name || t('notProvided')} />
                    <DetailField
                      label={t('phoneLabel')}
                      value={request.requester_phone ? <a href={`tel:${request.requester_phone}`} className="inline-flex items-center gap-1.5 text-primary hover:underline"><Phone className="size-3.5" />{request.requester_phone}</a> : t('notProvided')}
                    />
                    <DetailField
                      label={t('emailLabel')}
                      value={request.requester_email ? <a href={`mailto:${request.requester_email}`} className="inline-flex items-center gap-1.5 text-primary hover:underline"><Mail className="size-3.5" />{request.requester_email}</a> : t('notProvided')}
                    />
                  </dl>
                </SectionCard>

                <SectionCard icon={MapPin} title={t('locationSection')}>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <DetailField label={t('cityLabel')} value={request.city || t('notProvided')} />
                    <DetailField label={t('addressLabel')} value={request.intervention_address || t('notProvided')} />
                    <DetailField
                      label={t('coordinatesLabel')}
                      value={request.latitude != null && request.longitude != null ? `${request.latitude}, ${request.longitude}` : t('notProvided')}
                    />
                  </dl>
                  {request.latitude != null && request.longitude != null && (
                    <Button asChild variant="outline" size="sm" className="mt-4 gap-2">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${request.latitude},${request.longitude}`)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="size-4" />
                        {t('openMap')}
                      </a>
                    </Button>
                  )}
                </SectionCard>

                <SectionCard icon={CalendarDays} title={t('scheduleSection')}>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <DetailField label={t('desiredDateLabel')} value={formatDesiredDate(locale, request.desired_date) || t('notProvided')} />
                    <DetailField label={t('timeSlotLabel')} value={request.desired_time_slot || t('notProvided')} />
                    <DetailField label={t('createdAtLabel')} value={formatDateTime(locale, request.created_at) || t('notProvided')} />
                    <DetailField label={t('updatedAtLabel')} value={formatDateTime(locale, request.updated_at) || t('notProvided')} />
                  </dl>
                </SectionCard>

                <SectionCard icon={FileIcon} title={t('attachmentsSection')} className="xl:col-span-2">
                  {details.attachments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('noAttachments')}</p>
                  ) : (
                    <ul className="divide-y divide-border/40">
                      {details.attachments.map((attachment) => (
                        <li key={attachment.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                              {attachment.kind === 'PHOTO' ? <FileImage className="size-5" /> : <FileIcon className="size-5" />}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">{attachment.original_name}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {t(attachment.kind === 'PHOTO' ? 'photoKind' : 'documentKind')} · {formatFileSize(locale, attachment.file_size)}
                                {attachment.created_at ? ` · ${formatDateTime(locale, attachment.created_at)}` : ''}
                              </p>
                              {downloadError === attachment.id && <p className="mt-1 text-xs text-destructive">{t('downloadError')}</p>}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 gap-2 self-start sm:self-auto"
                            disabled={downloadingId === attachment.id}
                            onClick={() => handleDownload(attachment)}
                          >
                            {downloadingId === attachment.id ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                            {downloadingId === attachment.id ? t('downloading') : t('download')}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>

                <SectionCard icon={MessageSquareText} title={t('notesSection')} className="xl:col-span-2">
                  {details.shared_notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('noNotes')}</p>
                  ) : (
                    <ol className="relative space-y-5 before:absolute before:bottom-2 before:start-[7px] before:top-2 before:w-px before:bg-border">
                      {details.shared_notes.map((note) => (
                        <li key={note.id} className="relative ps-7">
                          <span className="absolute start-0 top-1.5 size-[15px] rounded-full border-4 border-card bg-primary" />
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              {note.actor_name || t(`actor.${note.actor_type.toLowerCase()}`)}
                            </p>
                            <time className="text-xs text-muted-foreground">{formatDateTime(locale, note.created_at)}</time>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground/80">{note.body}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                </SectionCard>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

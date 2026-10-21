"use client"

import Link from 'next/link'
import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Paperclip,
  Send,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MaalemPublicSummary } from '@/components/service-requests/maalem-public-summary'
import { RequestConfirmation } from '@/components/service-requests/request-confirmation'
import { RequestContactLocationFields, type RequestContactLocationValue } from '@/components/service-requests/request-contact-location-fields'
import { RequestPhotoField } from '@/components/service-requests/request-photo-field'
import {
  createQuickServiceRequest,
  createSelectedMaalemServiceRequest,
  createSelectedServiceRequest,
  ServiceRequestApiError,
} from '@/lib/service-requests'
import {
  getTodayForDateInput,
  SERVICE_REQUEST_LIMITS,
  validateServiceRequest,
  type ServiceRequestValidationErrors,
} from '@/lib/service-request-validation'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { clearAuth } from '@/state/slices/user-slice'
import type {
  PublicMaalemSummary,
  ServiceRequest,
  ServiceRequestFormContext,
  ServiceRequestFormValues,
  ServiceRequestMode,
} from '@/types/service-request'

function createSubmissionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `request_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

interface Props {
  context?: ServiceRequestFormContext
  mode?: ServiceRequestMode
  requestedMaalemId?: number
  maalem?: PublicMaalemSummary
  serviceId?: number
  serviceName?: string
  eyebrow?: string
  title?: string
  description?: string
  backHref?: string
  summary?: ReactNode
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} className="text-sm text-destructive">{message}</p> : null
}

function RequestRelay({ mode }: { mode: ServiceRequestMode }) {
  const t = useTranslations('serviceRequests.relay')
  const steps = [
    { title: t('requestTitle'), text: mode === 'selected_maalem' ? t('requestText') : t('requestTextGeneral') },
    { title: t('reviewTitle'), text: t('reviewText') },
    { title: t('assignmentTitle'), text: t('assignmentText') },
  ]
  return (
    <section aria-labelledby="service-request-relay" className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
      <div>
        <h2 id="service-request-relay" className="text-sm font-semibold">{t('eyebrow')}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{mode === 'selected_maalem' ? t('intro') : t('introGeneral')}</p>
      </div>
      <ol className="mt-5 space-y-5">
        {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xs font-semibold tabular-nums text-amber-800 dark:bg-amber-900/50 dark:text-amber-300" aria-hidden="true">0{index + 1}</span>
              <div>
                <p className="text-sm font-medium">{step.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.text}</p>
              </div>
            </li>
          ))}
      </ol>
    </section>
  )
}

export function ServiceRequestForm({
  context: suppliedContext,
  mode,
  requestedMaalemId,
  maalem,
  serviceId,
  serviceName,
  eyebrow,
  title,
  description,
  backHref,
  summary,
}: Props) {
  const t = useTranslations('serviceRequests')
  const locale = useLocale()
  const dispatch = useAppDispatch()
  const context: ServiceRequestFormContext = suppliedContext
    || (mode === 'selected_maalem' && maalem && requestedMaalemId
      ? { mode, requestedMaalemId, maalem, serviceId }
      : mode === 'selected_service' && serviceId && serviceName
        ? { mode, serviceId, serviceName }
        : { mode: 'quick_request' })
  const { user, accessToken, isAuthenticated, isLoading } = useAppSelector((state) => state.user)
  const initialContact = useMemo<RequestContactLocationValue>(() => ({
    contactName: user?.nom_complet || [user?.prenom, user?.nom].filter(Boolean).join(' '),
    contactPhone: user?.telephone || '',
    city: user?.shipping_city || '',
    address: [user?.shipping_address_line1, user?.shipping_address_line2].filter(Boolean).join(', '),
    latitude: null,
    longitude: null,
  }), [user])
  const [problemDescription, setProblemDescription] = useState('')
  const [contact, setContact] = useState(initialContact)
  const [photos, setPhotos] = useState<File[]>([])
  const [desiredDate, setDesiredDate] = useState('')
  const [desiredTimeSlot, setDesiredTimeSlot] = useState('')
  const [sharedNote, setSharedNote] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [errors, setErrors] = useState<ServiceRequestValidationErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [createdRequest, setCreatedRequest] = useState<ServiceRequest | null>(null)
  const [serviceUnavailable, setServiceUnavailable] = useState(false)
  const submittingRef = useRef(false)
  const submissionId = useRef(createSubmissionId())
  const selectedService = context.mode === 'selected_service'
  const addressRequired = context.mode !== 'quick_request'
  const idPrefix = `service-request-${context.mode}`

  useEffect(() => {
    setContact((current) => ({
      ...current,
      contactName: current.contactName || initialContact.contactName,
      contactPhone: current.contactPhone || initialContact.contactPhone,
      city: current.city || initialContact.city,
      address: current.address || initialContact.address,
    }))
  }, [initialContact])

  const modeCopy = context.mode === 'selected_maalem'
    ? { eyebrow: t('form.eyebrow'), title: t('form.title'), description: t('form.intro') }
    : context.mode === 'selected_service'
      ? { eyebrow: t('form.serviceEyebrow'), title: t('form.serviceTitle'), description: t('form.serviceIntro') }
      : { eyebrow: t('form.quickEyebrow'), title: t('form.quickTitle'), description: t('form.quickIntro') }
  const resolvedSummary = summary || (context.mode === 'selected_maalem' ? (
    <MaalemPublicSummary
      maalem={context.maalem}
      locale={locale}
      compact
      className="rounded-2xl border border-border/70 px-5 shadow-sm"
      labels={{
        verified: t('summary.verified'),
        location: t('summary.location'),
        areas: t('summary.areas'),
        experience: (years) => t('summary.experience', { years }),
        noPhoto: t('summary.noPhoto'),
      }}
    />
  ) : null)
  const timingFields = (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-date`}>{selectedService ? t('fields.dateRequired') : t('fields.date')}</Label>
        <Input id={`${idPrefix}-date`} type="date" min={getTodayForDateInput()} value={desiredDate} onChange={(event) => setDesiredDate(event.target.value)} aria-invalid={Boolean(errors.desiredDate)} aria-describedby={errors.desiredDate ? `${idPrefix}-date-error` : undefined} required={selectedService} />
        <FieldError id={`${idPrefix}-date-error`} message={errors.desiredDate} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-slot`}>{selectedService ? t('fields.slotRequired') : t('fields.slot')}</Label>
        <Input id={`${idPrefix}-slot`} value={desiredTimeSlot} onChange={(event) => setDesiredTimeSlot(event.target.value)} placeholder={t('fields.slotPlaceholder')} maxLength={SERVICE_REQUEST_LIMITS.desiredTimeSlot} aria-invalid={Boolean(errors.desiredTimeSlot)} aria-describedby={errors.desiredTimeSlot ? `${idPrefix}-slot-error` : undefined} required={selectedService} />
        <FieldError id={`${idPrefix}-slot-error`} message={errors.desiredTimeSlot} />
      </div>
    </div>
  )

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submittingRef.current || !accessToken || serviceUnavailable) return
    const values: ServiceRequestFormValues = {
      problemDescription,
      contactPhone: contact.contactPhone,
      city: contact.city,
      address: contact.address,
      latitude: contact.latitude,
      longitude: contact.longitude,
      desiredDate,
      desiredTimeSlot,
      sharedNote,
      photos,
    }
    const nextErrors = validateServiceRequest(values, {
      descriptionRequired: t('validation.descriptionRequired'),
      phoneRequired: t('validation.phoneRequired'),
      cityRequired: t('validation.cityRequired'),
      addressRequired: t('validation.addressRequired'),
      dateRequired: t('validation.dateRequired'),
      timeSlotRequired: t('validation.timeSlotRequired'),
      tooLong: t('validation.tooLong'),
      datePast: t('validation.datePast'),
      gpsPair: t('validation.gpsPair'),
      gpsInvalid: t('validation.gpsInvalid'),
      tooManyPhotos: t('validation.tooManyPhotos'),
      photoInvalid: t('validation.photoInvalid'),
    }, new Date(), {
      addressRequired,
      desiredDateRequired: selectedService,
      desiredTimeSlotRequired: selectedService,
    })
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      if (nextErrors.sharedNote || nextErrors.photos || (!selectedService && (nextErrors.desiredDate || nextErrors.desiredTimeSlot))) setDetailsOpen(true)
      const fieldIds: Partial<Record<keyof ServiceRequestValidationErrors, string>> = {
        problemDescription: `${idPrefix}-description`,
        contactPhone: `${idPrefix}-contact-phone`,
        city: `${idPrefix}-city`,
        address: `${idPrefix}-address`,
        desiredDate: `${idPrefix}-date`,
        desiredTimeSlot: `${idPrefix}-slot`,
        sharedNote: `${idPrefix}-note`,
        photos: `${idPrefix}-photos`,
      }
      const firstError = Object.keys(nextErrors)[0] as keyof ServiceRequestValidationErrors
      window.requestAnimationFrame(() => document.getElementById(fieldIds[firstError] || '')?.focus())
      return
    }

    setErrors({})
    submittingRef.current = true
    setSubmitting(true)
    try {
      const commonInput = {
        problemDescription,
        contactName: contact.contactName,
        contactPhone: contact.contactPhone,
        city: contact.city,
        address: contact.address,
        latitude: contact.latitude,
        longitude: contact.longitude,
        desiredDate,
        desiredTimeSlot,
        photos,
        clientSubmissionId: submissionId.current,
      }
      const result = context.mode === 'selected_service'
        ? await createSelectedServiceRequest({ ...commonInput, serviceId: context.serviceId, additionalInformation: sharedNote }, accessToken)
        : context.mode === 'selected_maalem'
          ? await createSelectedMaalemServiceRequest({
              requestedMaalemId: context.requestedMaalemId,
              serviceId: context.serviceId,
              problemDescription,
              contactPhone: contact.contactPhone,
              city: contact.city,
              address: contact.address,
              latitude: contact.latitude,
              longitude: contact.longitude,
              desiredDate,
              desiredTimeSlot,
              sharedNote,
              photos,
              clientSubmissionId: submissionId.current,
            }, accessToken)
          : await createQuickServiceRequest({ ...commonInput, additionalInformation: sharedNote }, accessToken)
      setCreatedRequest(result.request)
      submissionId.current = createSubmissionId()
    } catch (error) {
      if (error instanceof ServiceRequestApiError) {
        if (error.status === 401) dispatch(clearAuth())
        if (error.errorType?.startsWith('SERVICE_')) setServiceUnavailable(true)
        if (error.fields.shared_note || error.fields.attachments || (!selectedService && (error.fields.desired_date || error.fields.desired_time_slot))) setDetailsOpen(true)
        setErrors({
          form: error.message,
          problemDescription: error.fields.problem_description,
          contactPhone: error.fields.contact_phone,
          city: error.fields.city,
          address: error.fields.address,
          desiredDate: error.fields.desired_date,
          desiredTimeSlot: error.fields.desired_time_slot,
          sharedNote: error.fields.shared_note,
          photos: error.fields.attachments,
        })
      } else {
        setErrors({ form: t('errors.unexpected') })
      }
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const authLoading = isLoading || Boolean(accessToken && !user)
  if (authLoading) return <div className="flex min-h-72 items-center justify-center" role="status" aria-label={t('auth.loading')}><Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" /></div>
  if (!isAuthenticated || !accessToken) {
    return (
      <section className="mx-auto my-10 max-w-lg rounded-3xl border border-amber-200/80 bg-[#fffaf0] px-7 py-10 shadow-[0_16px_50px_-30px_rgba(125,90,26,0.4)] sm:my-16 sm:p-10 dark:border-amber-900/50 dark:bg-card">
        <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100/80 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"><ShieldCheck className="h-4 w-4" aria-hidden="true" />{eyebrow || modeCopy.eyebrow}</p>
        <h1 className="mt-4 text-3xl font-semibold">{context.mode === 'selected_maalem' ? t('auth.title') : t('auth.action')}</h1>
        <p className="mt-3 text-muted-foreground">{t('auth.description')}</p>
        <Button asChild size="lg" className="mt-7 rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"><Link href={`/${locale}/login`}>{t('auth.action')}</Link></Button>
      </section>
    )
  }
  if (createdRequest) return <RequestConfirmation request={createdRequest} locale={locale} subjectName={context.mode === 'selected_service' ? context.serviceName : undefined} />

  return (
    <div className="mx-auto max-w-6xl rounded-3xl bg-[#f7f8f5] px-4 py-6 sm:px-8 sm:py-10 lg:py-12 dark:bg-background">
      {backHref && (
        <Link href={backHref} className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" /> {context.mode === 'selected_maalem' ? t('form.backToProfile') : t('form.back')}
        </Link>
      )}

      <header className="mb-7 max-w-3xl sm:mb-9">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-400">{eyebrow || modeCopy.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{title || modeCopy.title}</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{description || modeCopy.description}</p>
        <p className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300"><Check className="h-4 w-4" aria-hidden="true" />{t('form.requiredHint')}</p>
      </header>
      {resolvedSummary && <div className="mb-6 lg:hidden">{resolvedSummary}</div>}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
        <form onSubmit={submit} noValidate className="min-w-0 [&_input]:min-h-11 [&_input]:bg-background [&_input]:rounded-xl [&_textarea]:rounded-xl [&_textarea]:px-4 [&_textarea]:py-3 [&_textarea]:leading-6">
          <div className="space-y-5">
            <div aria-live="assertive">{errors.form && <div role="alert" className="flex gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /> {errors.form}</div>}</div>

            <section aria-labelledby={`${idPrefix}-need-heading`} className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
              <h2 id={`${idPrefix}-need-heading`} className="mb-5 flex items-center gap-3 text-lg font-semibold"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"><ClipboardList className="h-5 w-5" aria-hidden="true" /></span>{t('form.needSection')}</h2>
              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-description`}>{t('fields.description')} <span className="text-destructive">*</span></Label>
                <Textarea id={`${idPrefix}-description`} value={problemDescription} onChange={(event) => setProblemDescription(event.target.value)} placeholder={t('fields.descriptionPlaceholder')} rows={5} maxLength={SERVICE_REQUEST_LIMITS.description} aria-invalid={Boolean(errors.problemDescription)} aria-describedby={`${idPrefix}-description-hint${errors.problemDescription ? ` ${idPrefix}-description-error` : ''}`} required />
                <p id={`${idPrefix}-description-hint`} className="text-xs text-muted-foreground">{t('fields.descriptionHint')}</p>
                <FieldError id={`${idPrefix}-description-error`} message={errors.problemDescription} />
              </div>
            </section>

            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
              <RequestContactLocationFields value={contact} onChange={setContact} addressRequired={addressRequired} idPrefix={idPrefix} errors={{ contactPhone: errors.contactPhone, city: errors.city, address: errors.address }} />
            </div>

            {selectedService && <section aria-labelledby={`${idPrefix}-timing-heading`} className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
              <h2 id={`${idPrefix}-timing-heading`} className="mb-5 flex items-center gap-3 text-lg font-semibold"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"><CalendarDays className="h-5 w-5" aria-hidden="true" /></span>{t('form.timingSection')}</h2>
              {timingFields}
            </section>}

            <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm" aria-labelledby={`${idPrefix}-details-heading`}>
              <button type="button" aria-expanded={detailsOpen} aria-controls={`${idPrefix}-details-content`} onClick={() => setDetailsOpen((open) => !open)} className="flex min-h-20 w-full items-center gap-3 px-5 py-4 text-start transition-colors hover:bg-muted/40 active:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:px-7">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Paperclip className="h-5 w-5" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><span id={`${idPrefix}-details-heading`} className="block text-base font-semibold">{t('form.optionalSection')}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{selectedService ? t('form.optionalHintService') : t('form.optionalHint')}</span></span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none ${detailsOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              <div id={`${idPrefix}-details-content`} hidden={!detailsOpen} className="space-y-6 border-t border-border/70 px-5 py-6 sm:px-7">
                {!selectedService && <fieldset className="space-y-4"><legend className="mb-4 flex items-center gap-2 text-sm font-semibold"><CalendarDays className="h-4 w-4 text-emerald-700" aria-hidden="true" />{t('form.timingSection')}</legend>{timingFields}</fieldset>}
                <div className="space-y-5">
                  <RequestPhotoField id={`${idPrefix}-photos`} photos={photos} onChange={setPhotos} onError={(message) => setErrors((current) => ({ ...current, photos: message || undefined }))} />
                  <FieldError id={`${idPrefix}-photos-error`} message={errors.photos} />
                  <div className="space-y-2">
                    <Label htmlFor={`${idPrefix}-note`}>{t('fields.sharedNote')}</Label>
                    <Textarea id={`${idPrefix}-note`} value={sharedNote} onChange={(event) => setSharedNote(event.target.value)} rows={3} maxLength={SERVICE_REQUEST_LIMITS.sharedNote} placeholder={t('fields.sharedNotePlaceholder')} aria-invalid={Boolean(errors.sharedNote)} aria-describedby={`${idPrefix}-note-hint${errors.sharedNote ? ` ${idPrefix}-note-error` : ''}`} />
                    <p id={`${idPrefix}-note-hint`} className="text-xs text-muted-foreground">{t('fields.sharedNoteHint')}</p>
                    <FieldError id={`${idPrefix}-note-error`} message={errors.sharedNote} />
                  </div>
                </div>
              </div>
            </section>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <Button type="submit" size="lg" className="h-auto min-h-12 w-full whitespace-normal rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.99] hover:bg-primary/90 motion-reduce:transition-none" disabled={submitting || serviceUnavailable} aria-describedby={`${idPrefix}-submit-hint`}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                {serviceUnavailable ? t('form.serviceUnavailable') : submitting ? t('form.submitting') : t('form.submit')}
              </Button>
              <p id={`${idPrefix}-submit-hint`} className="mt-3 max-w-xl text-xs leading-relaxed text-muted-foreground">{t('form.submitHint')}</p>
              <div className="sr-only" aria-live="polite">{submitting ? t('form.submitting') : ''}</div>
            </div>
          </div>
        </form>

        <aside className="min-w-0 space-y-5 lg:sticky lg:top-24">
          {resolvedSummary && <div className="hidden lg:block">{resolvedSummary}</div>}
          <section className="rounded-2xl border border-emerald-800 bg-emerald-900 p-6 text-white shadow-sm dark:border-emerald-700">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-5 w-5 text-amber-300" aria-hidden="true" />{t('trust.title')}</h2>
            <p className="mt-3 text-sm leading-6 text-emerald-50/85">{t('trust.description')}</p>
          </section>
          <RequestRelay mode={context.mode} />
        </aside>
      </div>
    </div>
  )
}

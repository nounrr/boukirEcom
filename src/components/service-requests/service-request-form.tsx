"use client"

import Link from 'next/link'
import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Loader2,
  Send,
  ShieldCheck,
  UsersRound,
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

function RequestRelay() {
  const t = useTranslations('serviceRequests.relay')
  const steps = [
    { icon: ClipboardList, title: t('requestTitle'), text: t('requestText') },
    { icon: UsersRound, title: t('reviewTitle'), text: t('reviewText') },
    { icon: ShieldCheck, title: t('assignmentTitle'), text: t('assignmentText') },
  ]
  return (
    <section aria-labelledby="service-request-relay" className="overflow-hidden rounded-2xl border border-amber-200 bg-[#2d2a24] text-white shadow-sm dark:border-amber-900">
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <p id="service-request-relay" className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">{t('eyebrow')}</p>
        <p className="mt-1 text-sm text-white/75">{t('intro')}</p>
      </div>
      <ol className="grid md:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <li key={step.title} className="relative flex gap-3 border-white/10 px-5 py-5 md:border-e md:last:border-e-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-300/30 bg-amber-300/10 text-amber-300"><Icon className="h-4 w-4" aria-hidden="true" /></span>
              <div>
                <p className="text-sm font-semibold"><span className="me-1 text-amber-300">0{index + 1}</span> {step.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/65">{step.text}</p>
              </div>
              {index < 2 && <ArrowRight className="absolute -end-2 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 text-amber-300 md:block rtl:rotate-180" aria-hidden="true" />}
            </li>
          )
        })}
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
      labels={{
        verified: t('summary.verified'),
        location: t('summary.location'),
        areas: t('summary.areas'),
        experience: (years) => t('summary.experience', { years }),
        noPhoto: t('summary.noPhoto'),
      }}
    />
  ) : null)

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
      document.getElementById(fieldIds[firstError] || '')?.focus()
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
      <section className="mx-auto max-w-lg rounded-2xl border bg-card px-6 py-14 text-center shadow-sm">
        <ShieldCheck className="mx-auto h-11 w-11 text-primary" aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-bold">{t('auth.title')}</h1>
        <p className="mt-3 text-muted-foreground">{t('auth.description')}</p>
        <Button asChild size="lg" className="mt-6"><Link href={`/${locale}/login`}>{t('auth.action')}</Link></Button>
      </section>
    )
  }
  if (createdRequest) return <RequestConfirmation request={createdRequest} locale={locale} subjectName={context.mode === 'selected_service' ? context.serviceName : undefined} />

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {backHref && (
        <Link href={backHref} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" /> {t('form.back')}
        </Link>
      )}
      {context.mode === 'selected_maalem' && <RequestRelay />}

      <div className={`${context.mode === 'selected_maalem' ? 'mt-6' : ''} grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:gap-8`}>
        <form onSubmit={submit} noValidate className="overflow-hidden rounded-2xl border border-amber-200/70 bg-card shadow-[0_24px_70px_-48px_rgba(52,40,17,0.65)] dark:border-amber-900/60">
          <header className="border-b bg-[#fffaf0] px-5 py-6 dark:bg-amber-950/15 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">{eyebrow || modeCopy.eyebrow}</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title || modeCopy.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description || modeCopy.description}</p>
          </header>

          <div className="space-y-9 px-5 py-7 sm:px-8 sm:py-9">
            <div aria-live="assertive">{errors.form && <div role="alert" className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /> {errors.form}</div>}</div>

            <fieldset className="space-y-4">
              <legend className="flex items-center gap-3 text-lg font-semibold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-sm text-amber-900">01</span>{t('form.needSection')}</legend>
              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-description`}>{t('fields.description')} <span className="text-destructive">*</span></Label>
                <Textarea id={`${idPrefix}-description`} value={problemDescription} onChange={(event) => setProblemDescription(event.target.value)} placeholder={t('fields.descriptionPlaceholder')} rows={5} maxLength={SERVICE_REQUEST_LIMITS.description} aria-invalid={Boolean(errors.problemDescription)} aria-describedby={`${idPrefix}-description-hint${errors.problemDescription ? ` ${idPrefix}-description-error` : ''}`} required />
                <p id={`${idPrefix}-description-hint`} className="text-xs text-muted-foreground">{t('fields.descriptionHint')}</p>
                <FieldError id={`${idPrefix}-description-error`} message={errors.problemDescription} />
              </div>
            </fieldset>

            <div className="border-t pt-8">
              <RequestContactLocationFields value={contact} onChange={setContact} addressRequired={addressRequired} idPrefix={idPrefix} errors={{ contactPhone: errors.contactPhone, city: errors.city, address: errors.address }} />
            </div>

            <fieldset className="space-y-4 border-t pt-8">
              <legend className="text-lg font-semibold">{t('form.timingSection')}</legend>
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
            </fieldset>

            <fieldset className="space-y-5 border-t pt-8">
              <legend className="text-lg font-semibold">{t('form.detailsSection')}</legend>
              <RequestPhotoField id={`${idPrefix}-photos`} photos={photos} onChange={setPhotos} onError={(message) => setErrors((current) => ({ ...current, photos: message || undefined }))} />
              <FieldError id={`${idPrefix}-photos-error`} message={errors.photos} />
              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-note`}>{t('fields.sharedNote')}</Label>
                <Textarea id={`${idPrefix}-note`} value={sharedNote} onChange={(event) => setSharedNote(event.target.value)} rows={3} maxLength={SERVICE_REQUEST_LIMITS.sharedNote} placeholder={t('fields.sharedNotePlaceholder')} aria-invalid={Boolean(errors.sharedNote)} aria-describedby={`${idPrefix}-note-hint${errors.sharedNote ? ` ${idPrefix}-note-error` : ''}`} />
                <p id={`${idPrefix}-note-hint`} className="text-xs text-muted-foreground">{t('fields.sharedNoteHint')}</p>
                <FieldError id={`${idPrefix}-note-error`} message={errors.sharedNote} />
              </div>
            </fieldset>

            <div className="border-t pt-7">
              <Button type="submit" size="lg" className="h-12 w-full text-base font-semibold" disabled={submitting || serviceUnavailable} aria-describedby={`${idPrefix}-submit-hint`}>
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}
                {serviceUnavailable ? t('form.serviceUnavailable') : submitting ? t('form.submitting') : t('form.submit')}
              </Button>
              <p id={`${idPrefix}-submit-hint`} className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">{t('form.submitHint')}</p>
              <div className="sr-only" aria-live="polite">{submitting ? t('form.submitting') : ''}</div>
            </div>
          </div>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-24">
          {resolvedSummary}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
            <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" /><div><h2 className="font-semibold">{t('trust.title')}</h2><p className="mt-1 leading-relaxed text-emerald-900/75 dark:text-emerald-100/70">{t('trust.description')}</p></div></div>
          </div>
        </aside>
      </div>
    </div>
  )
}

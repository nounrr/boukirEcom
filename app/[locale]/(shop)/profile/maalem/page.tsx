'use client'

import { AccountSidebar } from '@/components/account/account-sidebar'
import { ShopPageLayout } from '@/components/layout/shop-page-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import {
  deleteMaalemDocument,
  downloadMaalemDocument,
  uploadMaalemCv,
  uploadMaalemRealizations,
} from '@/lib/maalem-documents'
import {
  useGetActiveMaalemCategoriesQuery,
  useGetMaalemProfileQuery,
  useGetMaalemNotificationsQuery,
  useJoinMaalemProgramMutation,
  useMarkMaalemNotificationReadMutation,
  useSaveMaalemDraftMutation,
  useSubmitMaalemProfileMutation,
} from '@/state/api/auth-api-slice'
import { useAppSelector } from '@/state/hooks'
import type {
  MaalemAvailability,
  MaalemProfessionalData,
  MaalemProfileDocument,
  MaalemProfileStatus,
} from '@/types/maalem-profile'
import {
  AlertCircle,
  Bell,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Download,
  FileText,
  ImagePlus,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  UserRound,
  Wrench,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'

const EMPTY_PROFESSIONAL_DATA: MaalemProfessionalData = {
  skills: [],
  contact_phone: null,
  city: null,
  intervention_areas: [],
  experience_years: null,
  professional_summary: null,
  experiences: null,
  availability: null,
  other_information: null,
}

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_REALIZATIONS = 8
const STATUS_BADGE_CLASSES: Record<MaalemProfileStatus, string> = {
  draft: 'bg-muted text-foreground hover:bg-muted',
  submitted: 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-200',
  under_review: 'bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-200',
  approved: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-200',
  rejected: 'bg-red-100 text-red-900 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-200',
  suspended: 'bg-orange-100 text-orange-900 hover:bg-orange-100 dark:bg-orange-950/50 dark:text-orange-200',
}
const STATUS_MESSAGE_CLASSES: Partial<Record<MaalemProfileStatus, string>> = {
  submitted: 'border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100',
  under_review: 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100',
  suspended: 'border-orange-200 bg-orange-50 text-orange-950 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-100',
}

type FieldErrors = Partial<Record<keyof MaalemProfessionalData | 'category_id', string>>

function messageFromError(error: unknown, fallback: string) {
  const candidate = error as { data?: { message?: string }; message?: string }
  return candidate?.data?.message || candidate?.message || fallback
}

function formatFileSize(bytes: number, locale: string) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(bytes / 1024 / 1024) + ' MB'
}

interface TagInputProps {
  id: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder: string
  addLabel: string
  removeLabel: (value: string) => string
  disabled?: boolean
  maxItems: number
  maxLength: number
  error?: string
}

function TagInput({
  id,
  values,
  onChange,
  placeholder,
  addLabel,
  removeLabel,
  disabled,
  maxItems,
  maxLength,
  error,
}: TagInputProps) {
  const [draft, setDraft] = useState('')

  const addValue = () => {
    const value = draft.trim().replace(/,$/, '').trim()
    if (!value || value.length > maxLength || values.length >= maxItems) return
    if (!values.some((item) => item.toLocaleLowerCase() === value.toLocaleLowerCase())) {
      onChange([...values, value])
    }
    setDraft('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addValue()
    }
    if (event.key === 'Backspace' && !draft && values.length) {
      onChange(values.slice(0, -1))
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={`flex min-h-11 flex-wrap items-center gap-2 rounded-lg border bg-background px-2 py-1.5 transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 ${
          error ? 'border-destructive' : 'border-input'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        {values.map((value) => (
          <Badge key={value} variant="secondary" className="gap-1 py-1 text-xs">
            {value}
            {!disabled && (
              <button
                type="button"
                aria-label={removeLabel(value)}
                className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onChange(values.filter((item) => item !== value))}
              >
                <X className="size-3" />
              </button>
            )}
          </Badge>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addValue}
          disabled={disabled || values.length >= maxItems}
          maxLength={maxLength + 1}
          placeholder={values.length ? '' : placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-7 min-w-40 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
        {!disabled && draft.trim() && (
          <button
            type="button"
            onClick={addValue}
            className="inline-flex size-7 items-center justify-center rounded-md text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={addLabel}
          >
            <Plus className="size-4" />
          </button>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span id={error ? `${id}-error` : undefined} className={error ? 'text-destructive' : 'text-muted-foreground'}>{error || addLabel}</span>
        <span className="text-muted-foreground" dir="ltr">{values.length}/{maxItems}</span>
      </div>
    </div>
  )
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Wrench
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div>
        <h2 className="font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export default function MaalemApplicationPage() {
  const locale = useLocale()
  const t = useTranslations('maalemApplication')
  const { user, accessToken, isAuthenticated } = useAppSelector((state) => state.user)
  const canApply = Boolean(
    user && (user.type_compte === 'Artisan/Promoteur' || user.artisan_approuve)
  )
  const queryOptions = { skip: !canApply || !accessToken }
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    refetch: refetchProfile,
  } = useGetMaalemProfileQuery(undefined, queryOptions)
  const { data: notifications = [] } = useGetMaalemNotificationsQuery(undefined, queryOptions)
  const [markNotificationRead] = useMarkMaalemNotificationReadMutation()
  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useGetActiveMaalemCategoriesQuery(undefined, queryOptions)
  const [saveDraft, { isLoading: isSaving }] = useSaveMaalemDraftMutation()
  const [submitProfile, { isLoading: isSubmitting }] = useSubmitMaalemProfileMutation()
  const [
    joinMaalemProgram,
    { isError: isJoinError, error: joinError },
  ] = useJoinMaalemProgramMutation()
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [data, setData] = useState<MaalemProfessionalData>(EMPTY_PROFESSIONAL_DATA)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [uploadKind, setUploadKind] = useState<'cv' | 'realizations' | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const initializedProfileId = useRef<number | null>(null)
  const joinAttempted = useRef(false)
  const cvInputRef = useRef<HTMLInputElement>(null)
  const realizationInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (
      !canApply
      || !accessToken
      || isProfileLoading
      || isProfileError
      || profile
      || joinAttempted.current
    ) return

    joinAttempted.current = true
    joinMaalemProgram()
      .unwrap()
      .then(() => refetchProfile())
      .catch(() => undefined)
  }, [
    accessToken,
    canApply,
    isProfileError,
    isProfileLoading,
    joinMaalemProgram,
    profile,
    refetchProfile,
  ])

  useEffect(() => {
    if (!user || !profile || isProfileLoading || isCategoriesLoading || initializedProfileId.current === profile.id) return
    const existingData = profile?.professional_data
    setData({
      ...EMPTY_PROFESSIONAL_DATA,
      ...existingData,
      skills: existingData?.skills || [],
      intervention_areas: existingData?.intervention_areas || [],
      contact_phone: existingData?.contact_phone || user.telephone || null,
      city: existingData?.city || user.shipping_city || null,
    })
    const activeCategory = categories.some((category) => category.id === profile?.category_id)
    setCategoryId(activeCategory ? profile?.category_id ?? null : null)
    initializedProfileId.current = profile.id
  }, [categories, isCategoriesLoading, isProfileLoading, profile, user])

  const editable = profile?.status === 'draft' || profile?.status === 'rejected'
  const documents = profile?.documents || []
  const cv = documents.find((document) => document.kind === 'cv')
  const realizations = documents.filter((document) => document.kind === 'realization')
  const inactiveCategory = Boolean(profile?.category && !profile.category.is_active)
  const selectedCategoryIsActive = categories.some((category) => category.id === categoryId)
  const effectivePhone = data.contact_phone?.trim() || user?.telephone?.trim() || ''
  const completedChecks = [
    selectedCategoryIsActive,
    data.skills.length > 0,
    Boolean(effectivePhone),
    Boolean(data.city?.trim()),
    data.experience_years !== null,
    Boolean(data.professional_summary?.trim()),
    Boolean(data.availability),
  ]
  const completion = Math.round(
    (completedChecks.filter(Boolean).length / completedChecks.length) * 100
  )
  const busy = isSaving || isSubmitting || uploadKind !== null

  const setField = <K extends keyof MaalemProfessionalData>(
    field: K,
    value: MaalemProfessionalData[K]
  ) => {
    setData((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const validateForSubmission = () => {
    const next: FieldErrors = {}
    if (!categoryId || !selectedCategoryIsActive) next.category_id = t('validation.category')
    if (!data.skills.length) next.skills = t('validation.skills')
    if (!effectivePhone || !/^[+\d][\d\s().-]{6,29}$/.test(effectivePhone)) {
      next.contact_phone = t('validation.phone')
    }
    if (!data.city?.trim()) next.city = t('validation.city')
    if (
      data.experience_years === null
      || !Number.isInteger(data.experience_years)
      || data.experience_years < 0
      || data.experience_years > 70
    ) next.experience_years = t('validation.years')
    if (!data.professional_summary?.trim()) {
      next.professional_summary = t('validation.summary')
    }
    if (!data.availability) next.availability = t('validation.availability')
    setErrors(next)
    const firstError = Object.keys(next)[0] as keyof FieldErrors | undefined
    if (firstError) {
      const fieldIds: Record<keyof FieldErrors, string> = {
        category_id: 'maalem-category',
        skills: 'maalem-skills',
        contact_phone: 'maalem-phone',
        city: 'maalem-city',
        intervention_areas: 'maalem-areas',
        experience_years: 'maalem-years',
        professional_summary: 'professional-summary',
        experiences: 'experiences',
        availability: 'maalem-availability',
        other_information: 'other-information',
      }
      requestAnimationFrame(() => {
        const field = document.getElementById(fieldIds[firstError])
        field?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        field?.focus({ preventScroll: true })
      })
    }
    return Object.keys(next).length === 0
  }

  const validateDraftValues = () => {
    const next: FieldErrors = {}
    const phone = data.contact_phone?.trim()
    if (phone && !/^[+\d][\d\s().-]{6,29}$/.test(phone)) {
      next.contact_phone = t('validation.phone')
    }
    if (
      data.experience_years !== null
      && (!Number.isInteger(data.experience_years)
        || data.experience_years < 0
        || data.experience_years > 70)
    ) next.experience_years = t('validation.years')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const persistDraft = async ({ silent = false }: { silent?: boolean } = {}) => {
    const saved = await saveDraft({ category_id: categoryId, professional_data: data }).unwrap()
    if (!silent) toast.success(t('toasts.savedTitle'), { description: t('toasts.savedDesc') })
    return saved
  }

  const handleSave = async () => {
    if (!validateDraftValues()) {
      toast.warning(t('toasts.incompleteTitle'), { description: t('toasts.saveError') })
      return
    }
    try {
      await persistDraft()
    } catch (error) {
      toast.error(t('toasts.errorTitle'), {
        description: messageFromError(error, t('toasts.saveError')),
      })
    }
  }

  const handleSubmit = async () => {
    if (!validateForSubmission()) {
      toast.warning(t('toasts.incompleteTitle'), { description: t('toasts.incompleteDesc') })
      return
    }
    try {
      await persistDraft({ silent: true })
      await submitProfile().unwrap()
      await refetchProfile()
      toast.success(t('toasts.submittedTitle'), { description: t('toasts.submittedDesc') })
    } catch (error) {
      toast.error(t('toasts.errorTitle'), {
        description: messageFromError(error, t('toasts.submitError')),
      })
    }
  }

  const ensureDraftExists = async () => {
    if (!profile) await persistDraft({ silent: true })
  }

  const handleCvUpload = async (file?: File) => {
    if (!file || !accessToken) return
    if (file.type !== 'application/pdf' || file.size > MAX_FILE_SIZE) {
      toast.error(t('documents.invalidCvTitle'), { description: t('documents.invalidCvDesc') })
      return
    }
    setUploadKind('cv')
    try {
      await ensureDraftExists()
      await uploadMaalemCv(accessToken, file)
      await refetchProfile()
      toast.success(t('documents.cvUploaded'))
    } catch (error) {
      toast.error(t('toasts.errorTitle'), {
        description: messageFromError(error, t('documents.uploadError')),
      })
    } finally {
      setUploadKind(null)
      if (cvInputRef.current) cvInputRef.current.value = ''
    }
  }

  const handleRealizationsUpload = async (files: File[]) => {
    if (!files.length || !accessToken) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (
      files.some((file) => !allowed.includes(file.type) || file.size > MAX_FILE_SIZE) ||
      files.length + realizations.length > MAX_REALIZATIONS
    ) {
      toast.error(t('documents.invalidPhotosTitle'), { description: t('documents.invalidPhotosDesc') })
      return
    }
    setUploadKind('realizations')
    try {
      await ensureDraftExists()
      await uploadMaalemRealizations(accessToken, files)
      await refetchProfile()
      toast.success(t('documents.photosUploaded'))
    } catch (error) {
      toast.error(t('toasts.errorTitle'), {
        description: messageFromError(error, t('documents.uploadError')),
      })
    } finally {
      setUploadKind(null)
      if (realizationInputRef.current) realizationInputRef.current.value = ''
    }
  }

  const handleDeleteDocument = async (document: MaalemProfileDocument) => {
    if (!accessToken) return
    setDeletingId(document.id)
    try {
      await deleteMaalemDocument(accessToken, document.id)
      await refetchProfile()
      toast.success(t('documents.deleted'))
    } catch (error) {
      toast.error(t('toasts.errorTitle'), {
        description: messageFromError(error, t('documents.deleteError')),
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownload = async (document: MaalemProfileDocument) => {
    if (!accessToken) return
    setDownloadingId(document.id)
    try {
      await downloadMaalemDocument(accessToken, document.id, document.original_name)
    } catch (error) {
      toast.error(t('toasts.errorTitle'), {
        description: messageFromError(error, t('documents.downloadError')),
      })
    } finally {
      setDownloadingId(null)
    }
  }

  if (!isAuthenticated && !accessToken) {
    return (
      <ShopPageLayout title={t('title')} showHeader={false}>
        <Card className="mx-auto max-w-xl rounded-2xl">
          <CardContent className="flex flex-col items-center py-8 text-center">
            <LockKeyhole className="mb-4 size-10 text-primary" />
            <h1 className="text-xl font-semibold">{t('auth.title')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('auth.description')}</p>
            <Button asChild className="mt-5">
              <Link href={`/${locale}/login`}>{t('auth.action')}</Link>
            </Button>
          </CardContent>
        </Card>
      </ShopPageLayout>
    )
  }

  if (!user || isProfileLoading || isCategoriesLoading || (canApply && !profile && !isJoinError)) {
    return (
      <ShopPageLayout title={t('title')} showHeader={false}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-6">
          <AccountSidebar active="maalem" />
          <div className="space-y-4 lg:col-span-3">
            {[180, 280, 240].map((height) => (
              <div key={height} className="animate-pulse rounded-2xl border bg-card" style={{ height }} />
            ))}
          </div>
        </div>
      </ShopPageLayout>
    )
  }

  if (!canApply) {
    return (
      <ShopPageLayout title={t('title')} showHeader={false}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-6">
          <AccountSidebar active="profile" />
          <Card className="rounded-2xl lg:col-span-3">
            <CardContent className="flex flex-col items-start py-8 sm:flex-row sm:gap-5">
              <span className="mb-4 flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 sm:mb-0">
                <ShieldCheck className="size-6" />
              </span>
              <div>
                <h1 className="text-xl font-semibold">{t('access.title')}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {t('access.description')}
                </p>
                <Button asChild className="mt-5">
                  <Link href={`/${locale}/profile`}>
                    {t('access.action')} <ChevronRight className="rtl:rotate-180" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ShopPageLayout>
    )
  }

  if (isProfileError || isCategoriesError || isJoinError) {
    return (
      <ShopPageLayout title={t('title')} showHeader={false}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-6">
          <AccountSidebar active="maalem" />
          <Card className="rounded-2xl lg:col-span-3">
            <CardContent className="py-10 text-center">
              <AlertCircle className="mx-auto size-10 text-destructive" />
              <h1 className="mt-4 text-lg font-semibold">{t('errorState.title')}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {isJoinError
                  ? messageFromError(joinError, t('errorState.description'))
                  : t('errorState.description')}
              </p>
              <Button className="mt-5" onClick={() => window.location.reload()}>{t('errorState.action')}</Button>
            </CardContent>
          </Card>
        </div>
      </ShopPageLayout>
    )
  }

  const status = profile?.status || 'draft'

  return (
    <ShopPageLayout title={t('title')} showHeader={false}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-6">
        <AccountSidebar active="maalem" />
        <main className="min-w-0 space-y-4 lg:col-span-3 lg:space-y-6">
          <Card className="overflow-hidden rounded-2xl border-primary/20 py-0">
            <div className="border-s-4 border-primary px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div className="max-w-2xl">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge className={`gap-1.5 ${STATUS_BADGE_CLASSES[status]}`} variant="secondary">
                      <span className="size-1.5 rounded-full bg-current" />
                      {t(`statuses.${status}`)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{t('header.secure')}</span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {t('header.title')}
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('header.description')}</p>
                  <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-sm text-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{t('header.artisanPreserved')}</span>
                  </div>
                </div>
                <div className="w-full rounded-xl border bg-muted/20 p-4 sm:w-48">
                  <div className="flex items-end justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">{t('header.completion')}</span>
                    <strong className="text-xl tabular-nums text-primary">{completion}%</strong>
                  </div>
                  <Progress value={completion} className="mt-3" />
                  <p className="mt-2 text-[11px] leading-4 text-muted-foreground">{t('header.completionHint')}</p>
                </div>
              </div>
            </div>
          </Card>

          {!editable && (
            <div className={`flex items-start gap-3 rounded-2xl border p-4 ${STATUS_MESSAGE_CLASSES[status] || STATUS_MESSAGE_CLASSES.submitted}`}>
              <LockKeyhole className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{t(`statusMessages.${status}.title`)}</p>
                <p className="mt-1 text-xs leading-5 opacity-80">{t(`statusMessages.${status}.description`)}</p>
              </div>
            </div>
          )}

          {status === 'approved' && (
            <Card className="rounded-2xl border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20">
              <CardContent className="flex flex-col items-start justify-between gap-4 py-5 sm:flex-row sm:items-center">
                <div><p className="font-semibold">Missions Maalem</p><p className="mt-1 text-sm text-muted-foreground">Consultez uniquement vos affectations actuelles, suivez l’intervention et déposez votre compte-rendu.</p></div>
                <Button asChild><Link href={`/${locale}/profile/maalem/missions`}>Ouvrir mes missions <ChevronRight className="size-4" /></Link></Button>
              </CardContent>
            </Card>
          )}

          {status === 'rejected' && profile?.status_reason && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-950 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">
              <AlertCircle className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{t('rejection.title')}</p>
                <p className="mt-1 text-sm leading-5">{profile.status_reason}</p>
              </div>
            </div>
          )}

          {notifications.length > 0 && (
            <Card className="rounded-2xl">
              <CardHeader className="border-b pb-5">
                <SectionHeading
                  icon={Bell}
                  title={locale === 'ar' ? 'إشعارات ملف المعلم' : 'Notifications de votre dossier'}
                  description={locale === 'ar' ? 'آخر مراحل معالجة طلبك.' : 'Les dernières étapes importantes du traitement de votre candidature.'}
                />
              </CardHeader>
              <CardContent className="divide-y p-0">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => { if (!notification.read_at) markNotificationRead(notification.id) }}
                    className="block w-full px-5 py-4 text-start hover:bg-muted/40 sm:px-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                        <p className="mt-1 whitespace-pre-line text-sm leading-6 text-muted-foreground">{notification.body}</p>
                      </div>
                      {!notification.read_at && <span className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" aria-label={locale === 'ar' ? 'غير مقروء' : 'Non lu'} />}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(notification.created_at))}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl">
            <CardHeader className="border-b pb-5">
              <SectionHeading icon={UserRound} title={t('identity.title')} description={t('identity.description')} />
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border bg-muted/20 p-3.5">
                <span className="flex items-center gap-2 text-xs text-muted-foreground"><UserRound className="size-3.5" />{t('identity.name')}</span>
                <p className="mt-1.5 font-medium">{user.prenom} {user.nom}</p>
              </div>
              <div className="min-w-0 rounded-xl border bg-muted/20 p-3.5">
                <span className="flex items-center gap-2 text-xs text-muted-foreground"><Mail className="size-3.5" />{t('identity.email')}</span>
                <p className="mt-1.5 truncate font-medium" title={user.email}>{user.email}</p>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3.5">
                <span className="flex items-center gap-2 text-xs text-muted-foreground"><Phone className="size-3.5" />{t('identity.accountPhone')}</span>
                <p className="mt-1.5 font-medium" dir="ltr">{user.telephone || t('identity.notProvided')}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="border-b pb-5">
              <SectionHeading icon={Wrench} title={t('trade.title')} description={t('trade.description')} />
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="maalem-category">{t('fields.category')} <span className="text-destructive">*</span></Label>
                <Select
                  value={categoryId ? String(categoryId) : ''}
                  onValueChange={(value) => {
                    setCategoryId(Number(value))
                    setErrors((current) => ({ ...current, category_id: undefined }))
                  }}
                  disabled={!editable}
                >
                  <SelectTrigger id="maalem-category" className="h-11 w-full" aria-invalid={Boolean(errors.category_id)}>
                    <SelectValue placeholder={t('placeholders.category')} />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-72">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {locale === 'ar' ? category.nom_ar : category.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && <p className="text-xs text-destructive">{errors.category_id}</p>}
                {categories.length === 0 && (
                  <p className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                    {t('trade.noCategories')}
                  </p>
                )}
                {inactiveCategory && (
                  <p className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                    {t('trade.inactiveCategory', { name: profile?.category?.nom || '' })}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="maalem-skills">{t('fields.skills')} <span className="text-destructive">*</span></Label>
                <TagInput
                  id="maalem-skills"
                  values={data.skills}
                  onChange={(values) => setField('skills', values)}
                  placeholder={t('placeholders.skills')}
                  addLabel={t('hints.tags')}
                  removeLabel={(value) => t('hints.removeTag', { value })}
                  disabled={!editable}
                  maxItems={20}
                  maxLength={80}
                  error={errors.skills}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="border-b pb-5">
              <SectionHeading icon={MapPin} title={t('coverage.title')} description={t('coverage.description')} />
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maalem-phone">{t('fields.phone')} <span className="text-destructive">*</span></Label>
                <Input
                  id="maalem-phone"
                  value={data.contact_phone || ''}
                  onChange={(event) => setField('contact_phone', event.target.value || null)}
                  placeholder={user.telephone || t('placeholders.phone')}
                  disabled={!editable}
                  error={errors.contact_phone}
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">{t('hints.phone')}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maalem-city">{t('fields.city')} <span className="text-destructive">*</span></Label>
                <Input
                  id="maalem-city"
                  value={data.city || ''}
                  onChange={(event) => setField('city', event.target.value || null)}
                  placeholder={t('placeholders.city')}
                  disabled={!editable}
                  error={errors.city}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="maalem-areas">{t('fields.areas')}</Label>
                <TagInput
                  id="maalem-areas"
                  values={data.intervention_areas}
                  onChange={(values) => setField('intervention_areas', values)}
                  placeholder={t('placeholders.areas')}
                  addLabel={t('hints.tags')}
                  removeLabel={(value) => t('hints.removeTag', { value })}
                  disabled={!editable}
                  maxItems={20}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maalem-years">{t('fields.years')} <span className="text-destructive">*</span></Label>
                <Input
                  id="maalem-years"
                  type="number"
                  min={0}
                  max={70}
                  value={data.experience_years ?? ''}
                  onChange={(event) => setField('experience_years', event.target.value === '' ? null : Number(event.target.value))}
                  disabled={!editable}
                  error={errors.experience_years}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maalem-availability">{t('fields.availability')} <span className="text-destructive">*</span></Label>
                <Select
                  value={data.availability || ''}
                  onValueChange={(value) => setField('availability', value as MaalemAvailability)}
                  disabled={!editable}
                >
                  <SelectTrigger id="maalem-availability" className="h-11 w-full" aria-invalid={Boolean(errors.availability)}>
                    <SelectValue placeholder={t('placeholders.availability')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(['immediate', 'weekdays', 'weekends', 'evenings', 'on_request'] as MaalemAvailability[]).map((value) => (
                      <SelectItem key={value} value={value}>{t(`availability.${value}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.availability && <p className="text-xs text-destructive">{errors.availability}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="border-b pb-5">
              <SectionHeading icon={BriefcaseBusiness} title={t('experience.title')} description={t('experience.description')} />
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="professional-summary">{t('fields.summary')} <span className="text-destructive">*</span></Label>
                  <span className="text-xs text-muted-foreground" dir="ltr">{data.professional_summary?.length || 0}/2000</span>
                </div>
                <Textarea
                  id="professional-summary"
                  value={data.professional_summary || ''}
                  onChange={(event) => setField('professional_summary', event.target.value || null)}
                  placeholder={t('placeholders.summary')}
                  disabled={!editable}
                  maxLength={2000}
                  aria-invalid={Boolean(errors.professional_summary)}
                  className={errors.professional_summary ? 'border-destructive' : ''}
                />
                {errors.professional_summary && <p className="text-xs text-destructive">{errors.professional_summary}</p>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="experiences">{t('fields.experiences')}</Label>
                  <span className="text-xs text-muted-foreground" dir="ltr">{data.experiences?.length || 0}/5000</span>
                </div>
                <Textarea
                  id="experiences"
                  value={data.experiences || ''}
                  onChange={(event) => setField('experiences', event.target.value || null)}
                  placeholder={t('placeholders.experiences')}
                  disabled={!editable}
                  maxLength={5000}
                  className="min-h-36"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="other-information">{t('fields.other')}</Label>
                  <span className="text-xs text-muted-foreground" dir="ltr">{data.other_information?.length || 0}/2000</span>
                </div>
                <Textarea
                  id="other-information"
                  value={data.other_information || ''}
                  onChange={(event) => setField('other_information', event.target.value || null)}
                  placeholder={t('placeholders.other')}
                  disabled={!editable}
                  maxLength={2000}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="border-b pb-5">
              <SectionHeading icon={FileText} title={t('documents.title')} description={t('documents.description')} />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-dashed p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{t('documents.cvTitle')}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{t('documents.cvHint')}</p>
                    </div>
                    <FileText className="size-5 shrink-0 text-primary" />
                  </div>
                  <input ref={cvInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => handleCvUpload(event.target.files?.[0])} />
                  <Button type="button" variant="outline" size="sm" className="mt-4 w-full" disabled={!editable || busy} onClick={() => cvInputRef.current?.click()}>
                    {uploadKind === 'cv' ? <Loader2 className="animate-spin" /> : <Plus />}
                    {cv ? t('documents.replaceCv') : t('documents.addCv')}
                  </Button>
                </div>
                <div className="rounded-xl border border-dashed p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{t('documents.photosTitle')}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{t('documents.photosHint')}</p>
                    </div>
                    <ImagePlus className="size-5 shrink-0 text-primary" />
                  </div>
                  <input ref={realizationInputRef} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple className="hidden" onChange={(event) => handleRealizationsUpload(Array.from(event.target.files || []))} />
                  <Button type="button" variant="outline" size="sm" className="mt-4 w-full" disabled={!editable || busy || realizations.length >= MAX_REALIZATIONS} onClick={() => realizationInputRef.current?.click()}>
                    {uploadKind === 'realizations' ? <Loader2 className="animate-spin" /> : <Plus />}
                    {t('documents.addPhotos', { count: realizations.length, max: MAX_REALIZATIONS })}
                  </Button>
                </div>
              </div>

              {documents.length ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">{t('documents.savedFiles')}</p>
                  {documents.map((document) => (
                    <div key={document.id} className="flex flex-col gap-3 rounded-xl border bg-muted/10 p-3 sm:flex-row sm:items-center">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {document.kind === 'cv' ? <FileText className="size-4" /> : <ImagePlus className="size-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" title={document.original_name}>{document.original_name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{t(`documents.kinds.${document.kind}`)} · {formatFileSize(document.file_size, locale)}</p>
                      </div>
                      <div className="flex gap-2 self-end sm:self-auto">
                        <Button type="button" variant="outline" size="icon-sm" aria-label={t('documents.download')} disabled={downloadingId === document.id} onClick={() => handleDownload(document)}>
                          {downloadingId === document.id ? <Loader2 className="animate-spin" /> : <Download />}
                        </Button>
                        {editable && (
                          <Button type="button" variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" aria-label={t('documents.delete')} disabled={deletingId === document.id} onClick={() => handleDeleteDocument(document)}>
                            {deletingId === document.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-muted/30 px-4 py-5 text-center text-sm text-muted-foreground">
                  {t('documents.empty')}
                </div>
              )}
              <div className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                <LockKeyhole className="mt-0.5 size-3.5 shrink-0" />
                <span>{t('documents.private')}</span>
              </div>
            </CardContent>
          </Card>

          {editable && (
            <div className="flex flex-col gap-3 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur sm:sticky sm:bottom-3 sm:z-10 sm:flex-row sm:items-center sm:justify-between">
              <p className="px-1 text-xs leading-5 text-muted-foreground">{t('actions.hint')}</p>
              <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row">
                <Button type="button" variant="outline" disabled={busy} onClick={handleSave}>
                  {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                  {isSaving ? t('actions.saving') : t('actions.save')}
                </Button>
                <Button type="button" disabled={busy || categories.length === 0} onClick={handleSubmit}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
                  {isSubmitting ? t('actions.submitting') : t('actions.submit')}
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </ShopPageLayout>
  )
}

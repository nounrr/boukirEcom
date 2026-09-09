'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck, Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  createServiceRequestReview,
  getServiceRequestReviewContext,
  ServiceRequestApiError,
} from '@/lib/service-requests'
import { cn } from '@/lib/utils'
import type { MaalemReviewContext } from '@/types/service-request'

interface MaalemReviewFormProps {
  requestId: number
  accessToken: string
}

export function MaalemReviewForm({ requestId, accessToken }: MaalemReviewFormProps) {
  const t = useTranslations('serviceRequests.review')
  const [context, setContext] = useState<MaalemReviewContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadFailed(false)
    getServiceRequestReviewContext(requestId, accessToken)
      .then((result) => {
        if (!cancelled) setContext(result)
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [accessToken, reloadKey, requestId])

  if (loading) {
    return <div className="h-36 animate-pulse rounded-md border bg-muted/40" aria-label={t('loading')} />
  }

  if (loadFailed) {
    return (
      <section className="rounded-md border border-destructive/20 bg-destructive/5 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-foreground">{t('loadError')}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setReloadKey((value) => value + 1)}>
              {t('retry')}
            </Button>
          </div>
        </div>
      </section>
    )
  }

  if (!context || (!context.eligible && !context.review)) return null

  const review = context.review
  if (review) {
    return (
      <section className="rounded-md border-y bg-background py-7">
        <div className="flex items-start gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold text-foreground">{t('successTitle')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('successDescription')}</p>
            <div className="mt-4 flex gap-1" aria-label={t('yourRating', { rating: review.rating })}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Star key={value} className={cn('size-5', value <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/35')} />
              ))}
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/85">
              {review.comment || t('noComment')}
            </p>
          </div>
        </div>
      </section>
    )
  }

  const validate = () => {
    if (rating < context.constraints.rating_min || rating > context.constraints.rating_max) {
      setError(t('validation.rating'))
      return false
    }
    const cleanComment = comment.trim()
    if (cleanComment && cleanComment.length < context.constraints.comment_min) {
      setError(t('validation.commentTooShort', { count: context.constraints.comment_min }))
      return false
    }
    if (cleanComment.length > context.constraints.comment_max) {
      setError(t('validation.commentTooLong', { count: context.constraints.comment_max }))
      return false
    }
    setError(null)
    return true
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const created = await createServiceRequestReview(
        requestId,
        { rating, comment: comment.trim() || null },
        accessToken,
      )
      setContext((current) => current ? { ...current, eligible: false, reason: 'ALREADY_REVIEWED', review: created } : current)
    } catch (reason) {
      if (reason instanceof ServiceRequestApiError && reason.fields.comment) {
        setError(reason.fields.comment)
      } else if (reason instanceof ServiceRequestApiError && reason.fields.rating) {
        setError(reason.fields.rating)
      } else {
        setError(t('submitError'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="border-y bg-background">
      <div className="pt-7">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{t('eyebrow')}</p>
        <h2 className="mt-2 text-2xl font-medium text-foreground">{t('title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle', { maalem: context.maalem?.public_name || '', request: context.request.request_number })}</p>
      </div>
      <form className="space-y-6 py-7" onSubmit={submit} noValidate>
        <fieldset disabled={submitting}>
          <legend className="text-sm font-semibold text-foreground">{t('ratingLabel')}</legend>
          <div className="mt-3 flex w-fit gap-1" role="radiogroup" aria-label={t('ratingLabel')}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={t('starLabel', { count: value })}
                className="flex h-11 w-11 items-center justify-center rounded-md outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => { setRating(value); setError(null) }}
              >
                <Star className={cn('size-7 transition-colors', value <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/35 hover:text-amber-300')} />
              </button>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor={`maalem-review-${requestId}`}>
            {t('commentLabel')} <span className="font-normal text-muted-foreground">({t('optional')})</span>
          </Label>
          <Textarea
            className="min-h-32 rounded-md px-4 py-3 leading-6"
            id={`maalem-review-${requestId}`}
            value={comment}
            maxLength={context.constraints.comment_max}
            placeholder={t('placeholder')}
            disabled={submitting}
            aria-describedby={`maalem-review-hint-${requestId}`}
            onChange={(event) => { setComment(event.target.value); setError(null) }}
          />
          <div id={`maalem-review-hint-${requestId}`} className="flex justify-between gap-3 text-xs text-muted-foreground">
            <span>{t('commentHint', { count: context.constraints.comment_min })}</span>
            <span>{comment.length}/{context.constraints.comment_max}</span>
          </div>
        </div>

        {error && <p className="text-sm font-medium text-destructive" role="alert">{error}</p>}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            {t('moderation')}
          </p>
          <Button type="submit" className="min-h-11 shrink-0 gap-2 rounded-md bg-emerald-700 px-5 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? t('submitting') : t('submit')}
          </Button>
        </div>
      </form>
    </section>
  )
}

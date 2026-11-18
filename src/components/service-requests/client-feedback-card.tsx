'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { BadgeCheck, Loader2, Send, Star, ThumbsUp, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { API_CONFIG } from '@/lib/api-config'
import { cn } from '@/lib/utils'
import type { ServiceRequestDetails } from '@/types/service-request'

type Kind = 'validated' | 'complaint'

/**
 * Once the Maalem has finished, the client validates the work (with 1–5 stars) or files a complaint, with a comment the
 * team reads (same as the app). The stars go public on the Maalem's profile when the team closes the mission.
 * After that, the card just shows what they said (the review form below shows the stars).
 */
export function ClientFeedbackCard({ details, accessToken, onSent }: { details: ServiceRequestDetails; accessToken: string; onSent: () => void }) {
  const t = useTranslations('clientFeedback')
  const [kind, setKind] = useState<Kind>('validated')
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState<Kind | null>(null)

  const given = sent ?? details.client_feedback?.kind ?? null
  if (given) {
    const ok = given === 'validated'
    return (
      <section className={cn('flex items-center gap-3 rounded-2xl border p-5', ok ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200' : 'border-red-200 bg-red-50 text-red-900')}>
        {ok ? <BadgeCheck className="size-6 shrink-0" /> : <TriangleAlert className="size-6 shrink-0" />}
        <p className="font-semibold">{ok ? t('validatedDone') : t('complaintDone')}</p>
      </section>
    )
  }
  if (!details.can_give_feedback) return null

  const submit = async () => {
    const text = comment.trim()
    if (kind === 'complaint' && !text) return setError(t('complaintNeedsText'))
    if (kind === 'validated' && !rating) return setError(t('rateNeeded'))
    setBusy(true); setError('')
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/service-requests/${details.request.id}/client-feedback`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Platform: 'web' },
        body: JSON.stringify({ kind, comment: text || undefined, rating: rating || undefined }),
      })
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || t('error'))
      setSent(kind)
      onSent()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-amber-300 bg-card p-5 shadow-sm sm:p-6 dark:border-amber-700/60">
      <h2 className="text-lg font-semibold">{t('title')}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('text')}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" aria-pressed={kind === 'validated'} onClick={() => setKind('validated')}
          className={cn('flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 text-sm font-semibold', kind === 'validated' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-transparent bg-muted/50')}>
          <ThumbsUp className="size-4" />{t('validate')}
        </button>
        <button type="button" aria-pressed={kind === 'complaint'} onClick={() => setKind('complaint')}
          className={cn('flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 text-sm font-semibold', kind === 'complaint' ? 'border-red-600 bg-red-600 text-white' : 'border-transparent bg-muted/50')}>
          <TriangleAlert className="size-4" />{t('complaint')}
        </button>
      </div>
      <fieldset className="mt-4">
        <legend className="text-sm font-semibold">{kind === 'validated' ? t('rateLabel') : t('rateOptional')}</legend>
        <div className="mt-2 flex w-fit gap-1" role="radiogroup" aria-label={t('rateLabel')}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value}/5`}
              onClick={() => { setRating(value); setError('') }}
              className="flex size-11 items-center justify-center rounded-md outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
              <Star className={cn('size-7', value <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/35')} />
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{t('rateHint')}</p>
      </fieldset>
      <Textarea className="mt-3" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={kind === 'complaint' ? t('complaintPh') : t('commentPh')} />
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
      <Button type="button" disabled={busy} variant={kind === 'complaint' ? 'destructive' : 'default'} className="mt-3 min-h-11 w-full gap-2 rounded-xl" onClick={() => void submit()}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}{t('send')}
      </Button>
    </section>
  )
}

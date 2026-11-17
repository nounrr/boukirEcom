'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Banknote, BadgeCheck, Clock3, CreditCard, FileText, Landmark, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { redirectToCmiPayment } from '@/lib/cmi-payment'
import {
  billingStage,
  chooseServicePaymentMethod,
  getServicePayment,
  ServicePaymentError,
  startServiceCardPayment,
  type ServiceBilling,
  type ServicePaymentMethod,
} from '@/lib/service-payments'
import { cn } from '@/lib/utils'

const ICONS: Record<ServicePaymentMethod, React.ComponentType<{ className?: string }>> = {
  cmi: CreditCard,
  virement: Landmark,
  cheque: FileText,
  especes: Banknote,
}
const METHODS: ServicePaymentMethod[] = ['cmi', 'virement', 'cheque', 'especes']

/**
 * The request's price, set by the shop, and how to pay it: by card right away on the bank's page, or by transfer,
 * cheque or cash (the shop confirms the reception). Shown once the shop has confirmed the request with its amount.
 */
export function ServicePaymentCard({ requestId, accessToken }: { requestId: number; accessToken: string }) {
  const t = useTranslations('servicePayment')
  const locale = useLocale()
  const [billing, setBilling] = useState<ServiceBilling | null>(null)
  const [picked, setPicked] = useState<ServicePaymentMethod | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    getServicePayment(requestId, accessToken)
      .then((value) => { if (!cancelled) setBilling(value) })
      .catch(() => { if (!cancelled) setBilling(null) })
    return () => { cancelled = true }
  }, [requestId, accessToken])

  const stage = billingStage(billing)
  if (!billing || stage === 'none') return null
  const money = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'MAD' }).format(value)
  const method: ServicePaymentMethod = picked ?? billing.method ?? 'cmi'

  if (stage === 'paid') {
    return (
      <section className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-200">
        <BadgeCheck className="size-6 shrink-0" />
        <div>
          <p className="font-semibold">{t('paid', { amount: money(billing.amount) })}</p>
          <p className="text-xs opacity-80">{[billing.method ? t(`methods.${billing.method}`) : null, billing.paid_at ? new Date(billing.paid_at).toLocaleDateString(locale) : null].filter(Boolean).join(' · ')}</p>
        </div>
      </section>
    )
  }

  const pay = async () => {
    setNotice(null)
    setBusy(true)
    try {
      if (method === 'cmi') {
        if (!window.confirm(t('cardConfirm', { amount: money(billing.amount) }))) return
        const result = await startServiceCardPayment(requestId, locale, accessToken)
        if (!redirectToCmiPayment(result.cmi_payment)) setNotice({ ok: false, text: t('cardUnavailable') })
        return
      }
      const updated = await chooseServicePaymentMethod(requestId, method, accessToken)
      setBilling(updated)
      setPicked(null)
      setNotice({ ok: true, text: t('declaredNotice') })
    } catch (error) {
      setNotice({ ok: false, text: error instanceof ServicePaymentError && error.errorType === 'CMI_NOT_CONFIGURED' ? t('cardUnavailable') : (error as Error).message || t('error') })
    } finally {
      setBusy(false)
    }
  }

  const MethodIcon = ICONS[method]
  return (
    <section className="rounded-2xl border border-amber-300 bg-card p-5 shadow-sm sm:p-6 dark:border-amber-700/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="text-2xl font-bold text-amber-800 dark:text-amber-300">{money(billing.amount)}</p>
      </div>
      {stage === 'awaiting_shop' && billing.method && billing.method !== 'cmi' && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <Clock3 className="size-4 shrink-0" />{t('awaiting', { method: t(`methods.${billing.method}`) })}
        </p>
      )}
      <p className="mt-4 text-sm text-muted-foreground">{stage === 'awaiting_shop' ? t('changeMethod') : t('choose')}</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label={t('choose')}>
        {METHODS.map((key) => {
          const Icon = ICONS[key]
          const on = key === method
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setPicked(key)}
              className={cn(
                'flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-semibold transition-colors',
                on ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200' : 'border-transparent bg-muted/50 text-foreground hover:bg-muted',
              )}
            >
              <Icon className="size-5" />
              {t(`methods.${key}`)}
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{t(`hints.${method}`)}</p>
      <Button
        type="button"
        className="mt-4 min-h-11 w-full gap-2 rounded-xl"
        disabled={busy || (stage === 'awaiting_shop' && method === billing.method)}
        onClick={() => void pay()}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <MethodIcon className="size-4" />}
        {method === 'cmi' ? t('payCard', { amount: money(billing.amount) }) : t('confirmMethod', { method: t(`methods.${method}`) })}
      </Button>
      {notice && <p role="status" className={cn('mt-3 text-sm', notice.ok ? 'text-emerald-800 dark:text-emerald-300' : 'text-destructive')}>{notice.text}</p>}
    </section>
  )
}

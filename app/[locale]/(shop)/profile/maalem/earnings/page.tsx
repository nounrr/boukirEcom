'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useLocale } from 'next-intl'
import { ArrowLeft, Banknote, CheckSquare, Clock3, Loader2, ShoppingBag, Square, Wallet } from 'lucide-react'
import { AccountSidebar } from '@/components/account/account-sidebar'
import { ShopPageLayout } from '@/components/layout/shop-page-layout'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  useGetMaalemEarningsQuery,
  useMoveEarningsToShopMutation,
  type EarningState,
  type MaalemEarning,
} from '@/state/api/maalem-missions-api-slice'

const stateLabel: Record<EarningState, string> = {
  available: 'Disponible',
  pending: 'À venir : mission pas encore clôturée',
  paid_cash: 'Retiré en espèces',
  to_shop: 'Utilisé pour vos achats',
}

function errorText(error: unknown) {
  return (error as { data?: { message?: string } })?.data?.message || 'Une erreur est survenue'
}

/** "Mes gains": what each mission pays the Maalem, and moving the available money to their purchases. */
export default function MaalemEarningsPage() {
  const locale = useLocale()
  const { data, isLoading, error, refetch } = useGetMaalemEarningsQuery(undefined, { refetchOnMountOrArgChange: true })
  const [move, moveState] = useMoveEarningsToShopMutation()
  const [selected, setSelected] = useState<number[]>([])
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const money = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'MAD' }).format(value)
  const list = data?.earnings ?? []
  const available = list.filter((e) => e.state === 'available')
  const others = list.filter((e) => e.state !== 'available')
  const total = available.filter((e) => selected.includes(e.id)).reduce((sum, e) => sum + Math.round(e.amount * 100), 0) / 100
  const allChosen = available.length > 0 && selected.length === available.length
  const toggle = (id: number) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  async function moveToShop() {
    if (!selected.length) return
    if (!window.confirm(`Utiliser ${money(total)} pour vos achats ? Le montant s’ajoute à vos points d’achat et ne pourra plus être retiré en espèces.`)) return
    setNotice(null)
    try {
      const result = await move(selected).unwrap()
      setSelected([])
      setNotice({ ok: true, text: `${money(result.total)} ajoutés à vos achats. Points disponibles : ${money(result.remise_balance)}.` })
      void refetch()
    } catch (e) {
      setNotice({ ok: false, text: errorText(e) })
    }
  }

  const row = (e: MaalemEarning) => {
    const chosen = selected.includes(e.id)
    const tone = e.state === 'available' ? 'text-amber-800 dark:text-amber-300' : e.state === 'pending' ? 'text-muted-foreground' : 'text-emerald-800 dark:text-emerald-300'
    const date = e.state === 'pending' ? e.planned_date : e.settled_at ?? e.closed_at
    const body = (
      <>
        {e.state === 'available' && (chosen ? <CheckSquare className="size-5 shrink-0 text-amber-600" /> : <Square className="size-5 shrink-0 text-muted-foreground" />)}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{e.service_name || e.request_number}</span>
          <span className="block text-xs text-muted-foreground">{e.request_number}{date ? ` · ${new Date(date).toLocaleDateString(locale)}` : ''}</span>
          <span className={cn('block text-xs font-semibold', tone)}>{stateLabel[e.state]}</span>
        </span>
        <span className={cn('text-lg font-bold tabular-nums', tone)}>{money(e.amount)}</span>
      </>
    )
    const cls = cn('flex w-full items-center gap-4 rounded-2xl border-2 bg-card p-4 text-start transition-colors', chosen ? 'border-amber-500' : 'border-transparent hover:bg-muted/30')
    if (e.state === 'available') return <button key={e.id} type="button" role="checkbox" aria-checked={chosen} onClick={() => toggle(e.id)} className={cls}>{body}</button>
    return e.intervention_id
      ? <Link key={e.id} href={`/${locale}/profile/maalem/missions/${e.intervention_id}`} className={cls}>{body}</Link>
      : <div key={e.id} className={cls}>{body}</div>
  }

  return (
    <ShopPageLayout title="Mes gains" showHeader={false}>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 py-4 lg:grid-cols-4 lg:gap-10">
        <AccountSidebar active="earnings" />
        <main className="min-w-0 space-y-6 rounded-3xl bg-[#fbf8ef] p-4 sm:p-6 lg:col-span-3 dark:bg-muted/20">
          <Link href={`/${locale}/profile/maalem/missions`} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4 rtl:rotate-180" />Mes missions</Link>
          <header>
            <h1 className="text-3xl font-bold tracking-tight rtl:tracking-normal">Mes gains</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Le montant de chaque mission devient disponible quand l’équipe la clôture. Retirez-le en espèces au magasin, ou utilisez-le pour vos achats.</p>
          </header>

          {isLoading && <p role="status" className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Chargement…</p>}
          {error && <p role="alert" className="py-10 text-sm text-destructive">Accès impossible. Votre profil doit être approuvé et actif.</p>}

          {data && (
            <>
              <section className="rounded-2xl border border-amber-200 bg-card p-5 shadow-sm dark:border-border">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">Disponible</p>
                <p className="mt-1 text-4xl font-bold">{money(data.summary.available)}</p>
                <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  {[{ icon: Clock3, label: 'À venir', value: data.summary.pending }, { icon: Banknote, label: 'Retiré en espèces', value: data.summary.paid_cash }, { icon: ShoppingBag, label: 'Utilisé en achats', value: data.summary.to_shop }].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="rounded-xl bg-muted/40 p-3"><dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="size-3.5" />{label}</dt><dd className="mt-1 font-semibold">{money(value)}</dd></div>
                  ))}
                </dl>
              </section>

              {notice && <p role="status" className={cn('rounded-xl px-4 py-3 text-sm', notice.ok ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200' : 'bg-destructive/10 text-destructive')}>{notice.text}</p>}

              {list.length === 0 && (
                <section className="rounded-2xl border border-dashed p-8 text-center"><Wallet className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-semibold">Aucun gain pour l’instant</p><p className="mt-1 text-sm text-muted-foreground">Le montant de chaque mission apparaît ici dès que l’équipe vous l’affecte.</p></section>
              )}

              {available.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">À retirer</h2>
                    <button type="button" className="text-sm font-semibold text-amber-800 dark:text-amber-300" onClick={() => setSelected(allChosen ? [] : available.map((e) => e.id))}>{allChosen ? 'Tout retirer' : 'Tout choisir'}</button>
                  </div>
                  {available.map(row)}
                  <Button type="button" className="min-h-11 w-full gap-2 rounded-xl" disabled={!selected.length || moveState.isLoading} onClick={() => void moveToShop()}>
                    {moveState.isLoading ? <Loader2 className="size-4 animate-spin" /> : <ShoppingBag className="size-4" />}
                    {selected.length ? `Utiliser ${money(total)} pour mes achats` : 'Choisissez des missions'}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">Pour l’espèces, passez au magasin : l’équipe vous remet le montant.</p>
                </section>
              )}

              {others.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold">Historique</h2>
                  {others.map(row)}
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </ShopPageLayout>
  )
}

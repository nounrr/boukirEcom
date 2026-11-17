'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { CalendarDays, ChevronRight, MapPin, Wallet } from 'lucide-react'
import { AccountSidebar } from '@/components/account/account-sidebar'
import { ShopPageLayout } from '@/components/layout/shop-page-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  useGetMaalemEarningsQuery,
  useGetMaalemMissionsQuery,
  type EarningState,
  type MissionStatus,
} from '@/state/api/maalem-missions-api-slice'

/** Same wording as the app and the mission page: no "en route" / "arrivé" steps for the Maalem. */
const labels: Record<MissionStatus, string> = {
  assigned: 'À planifier', scheduled: 'Validée par l’équipe', to_do: 'Validée par l’équipe', en_route: 'Validée par l’équipe',
  arrived: 'Validée par l’équipe', work_in_progress: 'Travaux en cours', completed: 'Terminée — en attente de clôture', closed: 'Clôturée',
}

type Filter = 'all' | 'todo' | 'active' | 'done'
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Toutes' }, { key: 'todo', label: 'À démarrer' }, { key: 'active', label: 'En cours' }, { key: 'done', label: 'Terminées' },
]
/** Same grouping as the app: not started yet / working / finished or closed. */
function filterOf(status: MissionStatus): Exclude<Filter, 'all'> {
  if (status === 'work_in_progress') return 'active'
  if (status === 'completed' || status === 'closed') return 'done'
  return 'todo'
}

const earningLabel: Record<EarningState, string> = {
  pending: 'à venir', available: 'disponible', paid_cash: 'retiré en espèces', to_shop: 'utilisé en achats',
}

export default function MaalemMissionsPage() {
  const locale = useLocale()
  const { data, isLoading, error, refetch } = useGetMaalemMissionsQuery(undefined, { pollingInterval: 15_000, refetchOnFocus: true, refetchOnReconnect: true, refetchOnMountOrArgChange: true })
  const earnings = useGetMaalemEarningsQuery(undefined, { refetchOnMountOrArgChange: true, skip: Boolean(error) })
  const [filter, setFilter] = useState<Filter>('all')
  const all = useMemo(() => data?.missions ?? [], [data])
  // Finished missions go to the end, the ones to work on stay on top.
  const shown = useMemo(
    () => all.filter((m) => filter === 'all' || filterOf(m.status) === filter).sort((a, b) => Number(filterOf(a.status) === 'done') - Number(filterOf(b.status) === 'done')),
    [all, filter],
  )
  const amountOf = useMemo(() => new Map((earnings.data?.earnings ?? []).map((e) => [e.service_request_id, e])), [earnings.data])
  const money = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'MAD' }).format(value)
  const available = earnings.data?.summary.available ?? 0

  return (
    <ShopPageLayout title="Mes missions" showHeader={false}>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 py-4 lg:grid-cols-4 lg:gap-10">
        <AccountSidebar active="maalem" />
        <main className="min-w-0 rounded-3xl bg-[#fbf8ef] p-4 sm:p-6 lg:col-span-3 dark:bg-muted/20">
          <header className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xl">
              <h1 className="text-3xl font-bold tracking-tight rtl:tracking-normal">Mes missions</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Seules vos affectations actuelles sont visibles. Une disponibilité déclarée ne garantit pas un calendrier.</p>
            </div>
            <Button variant="outline" onClick={() => void refetch()} className="min-h-11 shrink-0 self-start rounded-md">Actualiser</Button>
          </header>

          {!error && (
            <Link href={`/${locale}/profile/maalem/earnings`} className={cn('mt-6 flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:bg-muted/30', available > 0 ? 'border-amber-400' : 'border-border')}>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"><Wallet className="size-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">Mes gains</span>
                <span className="block text-sm text-muted-foreground">{available > 0 ? `${money(available)} disponibles` : 'Voir le montant de chaque mission'}</span>
              </span>
              <ChevronRight className="size-5 text-muted-foreground rtl:rotate-180" />
            </Link>
          )}

          {all.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Filtrer les missions">
              {FILTERS.map(({ key, label }) => {
                const count = all.filter((m) => key === 'all' || filterOf(m.status) === key).length
                return (
                  <button key={key} type="button" role="tab" aria-selected={filter === key} onClick={() => setFilter(key)}
                    className={cn('min-h-10 rounded-full border px-4 text-sm font-medium transition-colors', filter === key ? 'border-foreground bg-foreground text-background' : 'border-border bg-card hover:bg-muted/40')}>
                    {label} · {count}
                  </button>
                )
              })}
            </div>
          )}

          {isLoading && <p role="status" className="py-14 text-sm text-muted-foreground">Chargement des missions…</p>}
          {error && <p role="alert" className="border-b border-border py-10 text-sm leading-6 text-destructive">Accès impossible. Votre profil doit être approuvé et actif.</p>}
          {!isLoading && !error && !all.length && <p className="border-b border-border py-14 text-sm leading-6 text-muted-foreground">Aucune mission ne vous est actuellement affectée.</p>}
          {!isLoading && !error && all.length > 0 && !shown.length && (
            <p className="py-14 text-sm leading-6 text-muted-foreground">Aucune mission dans ce filtre. <button type="button" className="font-medium underline" onClick={() => setFilter('all')}>Voir toutes</button></p>
          )}
          <div className="divide-y divide-border">
            {shown.map((mission) => {
              const earning = amountOf.get(mission.service_request_id)
              return (
                <Link key={mission.id} href={'/' + locale + '/profile/maalem/missions/' + mission.id} className="group block py-6 transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{mission.request_number}</p>
                      <h2 className="mt-2 text-xl font-semibold">{mission.service_name || mission.category_name || 'Intervention'}</h2>
                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2"><CalendarDays className="size-4 shrink-0" />{mission.planned_date?.slice(0, 10) || 'Date à confirmer'} · {mission.planned_time_slot || 'Créneau à confirmer'}</p>
                        <p className="flex items-center gap-2"><MapPin className="size-4 shrink-0" />{mission.mission_city || 'Ville non renseignée'}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="max-w-full whitespace-normal rounded-md border-emerald-900/15 bg-emerald-50 text-emerald-900 dark:border-emerald-300/20 dark:bg-emerald-950/30 dark:text-emerald-200">{labels[mission.status] ?? mission.status}</Badge>
                  </div>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex w-44 items-center gap-3">
                      <div className="h-1 flex-1 overflow-hidden bg-muted" role="progressbar" aria-label="Progression" aria-valuenow={mission.progress_percent} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-emerald-800 dark:bg-emerald-300" style={{ width: mission.progress_percent + '%' }} /></div>
                      <span className="text-xs tabular-nums text-muted-foreground">{mission.progress_percent}%</span>
                    </div>
                    {earning && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                        <Wallet className="size-3.5" />Votre montant : {money(earning.amount)} · {earningLabel[earning.state]}
                      </span>
                    )}
                    <span className="flex min-h-11 items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">Ouvrir <ChevronRight className="size-4 rtl:rotate-180" /></span>
                  </div>
                </Link>
              )
            })}
          </div>
        </main>
      </div>
    </ShopPageLayout>
  )
}

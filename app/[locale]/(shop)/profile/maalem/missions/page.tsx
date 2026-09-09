'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { CalendarDays, ChevronRight, MapPin } from 'lucide-react'
import { AccountSidebar } from '@/components/account/account-sidebar'
import { ShopPageLayout } from '@/components/layout/shop-page-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useGetMaalemMissionsQuery, type MissionStatus } from '@/state/api/maalem-missions-api-slice'

const labels: Record<MissionStatus, string> = {
  scheduled: 'Planifiée', to_do: 'À faire', en_route: 'En route', arrived: 'Arrivé',
  work_in_progress: 'Travaux en cours', completed: 'Terminée — en attente de clôture',
}

export default function MaalemMissionsPage() {
  const locale = useLocale()
  const { data, isLoading, error, refetch } = useGetMaalemMissionsQuery()
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
          {isLoading && <p role="status" className="py-14 text-sm text-muted-foreground">Chargement des missions…</p>}
          {error && <p role="alert" className="border-b border-border py-10 text-sm leading-6 text-destructive">Accès impossible. Votre profil doit être approuvé et actif.</p>}
          {!isLoading && !error && !data?.missions.length && <p className="border-b border-border py-14 text-sm leading-6 text-muted-foreground">Aucune mission planifiée ne vous est actuellement affectée.</p>}
          <div className="divide-y divide-border">
            {data?.missions.map((mission) => (
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
                  <Badge variant="outline" className="max-w-full whitespace-normal rounded-md border-emerald-900/15 bg-emerald-50 text-emerald-900 dark:border-emerald-300/20 dark:bg-emerald-950/30 dark:text-emerald-200">{labels[mission.status]}</Badge>
                </div>
                <div className="mt-6 flex items-center justify-between gap-6">
                  <div className="flex w-44 items-center gap-3">
                    <div className="h-1 flex-1 overflow-hidden bg-muted" role="progressbar" aria-label="Progression" aria-valuenow={mission.progress_percent} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-emerald-800 dark:bg-emerald-300" style={{ width: mission.progress_percent + '%' }} /></div>
                    <span className="text-xs tabular-nums text-muted-foreground">{mission.progress_percent}%</span>
                  </div>
                  <span className="flex min-h-11 items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">Ouvrir <ChevronRight className="size-4 rtl:rotate-180" /></span>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </ShopPageLayout>
  )
}

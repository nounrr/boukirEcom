'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { CalendarDays, ChevronRight, ClipboardList, MapPin } from 'lucide-react'
import { AccountSidebar } from '@/components/account/account-sidebar'
import { ShopPageLayout } from '@/components/layout/shop-page-layout'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useGetMaalemMissionsQuery, type MissionStatus } from '@/state/api/maalem-missions-api-slice'

const labels: Record<MissionStatus, string> = {
  scheduled: 'Planifiée', to_do: 'À faire', en_route: 'En route', arrived: 'Arrivé',
  work_in_progress: 'Travaux en cours', completed: 'Terminée — en attente de clôture',
}

export default function MaalemMissionsPage() {
  const locale = useLocale()
  const { data, isLoading, error, refetch } = useGetMaalemMissionsQuery()
  return <ShopPageLayout title="Mes missions" showHeader={false}>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-6">
      <AccountSidebar active="maalem" />
      <main className="min-w-0 space-y-4 lg:col-span-3">
        <Card className="rounded-2xl"><CardHeader><div className="flex items-start justify-between gap-4"><div><h1 className="flex items-center gap-2 text-2xl font-bold"><ClipboardList className="size-6 text-primary" />Mes missions</h1><p className="mt-2 text-sm text-muted-foreground">Seules vos affectations actuelles sont visibles. Une disponibilité déclarée ne garantit pas un calendrier.</p></div><button onClick={() => void refetch()} className="rounded-lg border px-3 py-2 text-sm">Actualiser</button></div></CardHeader></Card>
        {isLoading && <Card><CardContent className="py-12 text-center text-muted-foreground">Chargement des missions…</CardContent></Card>}
        {error && <Card><CardContent className="py-12 text-center text-destructive">Accès impossible. Votre profil doit être approuvé et actif.</CardContent></Card>}
        {!isLoading && !error && !data?.missions.length && <Card><CardContent className="py-12 text-center text-muted-foreground">Aucune mission planifiée ne vous est actuellement affectée.</CardContent></Card>}
        <div className="grid gap-4 md:grid-cols-2">{data?.missions.map((mission) => <Link key={mission.id} href={`/${locale}/profile/maalem/missions/${mission.id}`}>
          <Card className="h-full rounded-2xl transition hover:border-primary/40 hover:shadow-md"><CardContent className="space-y-4 pt-5">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">{mission.request_number}</p><h2 className="font-bold">{mission.service_name || mission.category_name || 'Intervention'}</h2></div><Badge variant="secondary">{labels[mission.status]}</Badge></div>
            <div className="space-y-2 text-sm text-muted-foreground"><p className="flex items-center gap-2"><CalendarDays className="size-4" />{mission.planned_date?.slice(0, 10) || 'Date à confirmer'} · {mission.planned_time_slot || 'Créneau à confirmer'}</p><p className="flex items-center gap-2"><MapPin className="size-4" />{mission.mission_city || 'Ville non renseignée'}</p></div>
            <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${mission.progress_percent}%` }} /></div>
            <div className="flex items-center justify-between text-xs"><span>{mission.progress_percent}%</span><span className="flex items-center gap-1 font-semibold text-primary">Ouvrir <ChevronRight className="size-4" /></span></div>
          </CardContent></Card>
        </Link>)}</div>
      </main>
    </div>
  </ShopPageLayout>
}

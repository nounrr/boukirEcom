'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Camera, CheckCircle2, MapPin, Navigation, Phone, Play, Save } from 'lucide-react'
import { AccountSidebar } from '@/components/account/account-sidebar'
import { ShopPageLayout } from '@/components/layout/shop-page-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { API_CONFIG } from '@/lib/api-config'
import { useAppSelector } from '@/state/hooks'
import {
  useGetMaalemMissionQuery, useTransitionMaalemMissionMutation,
  useUpdateMaalemMissionProgressMutation, useUpdateMaalemMissionReportMutation,
  type MissionStatus,
} from '@/state/api/maalem-missions-api-slice'

const labels: Record<MissionStatus, string> = { scheduled: 'Planifiée', to_do: 'À faire', en_route: 'En route', arrived: 'Arrivé', work_in_progress: 'Travaux en cours', completed: 'Terminée — contrôle équipe requis' }
const transitions: Partial<Record<MissionStatus, { status: MissionStatus; label: string; icon: typeof Navigation }>> = {
  to_do: { status: 'en_route', label: 'Je suis en route', icon: Navigation },
  en_route: { status: 'arrived', label: 'Je suis arrivé', icon: MapPin },
  arrived: { status: 'work_in_progress', label: 'Démarrer les travaux', icon: Play },
  work_in_progress: { status: 'completed', label: 'Terminer l’intervention', icon: CheckCircle2 },
}

function message(error: unknown) {
  const value = error as { data?: { message?: string; errors?: Record<string, string> } }
  return [value.data?.message, ...(value.data?.errors ? Object.values(value.data.errors) : [])].filter(Boolean).join(' · ') || 'Une erreur est survenue'
}

export default function MaalemMissionDetailPage() {
  const locale = useLocale()
  const id = Number(useParams<{ id: string }>().id)
  const token = useAppSelector((state) => state.user.accessToken)
  const query = useGetMaalemMissionQuery(id, { skip: !Number.isInteger(id) })
  const mission = query.data?.mission
  const [transition, transitionState] = useTransitionMaalemMissionMutation()
  const [updateProgress, progressState] = useUpdateMaalemMissionProgressMutation()
  const [updateReport, reportState] = useUpdateMaalemMissionReportMutation()
  const [feedback, setFeedback] = useState('')
  const [progress, setProgress] = useState(0)
  const [report, setReport] = useState({ work_summary: '', maalem_observations: '', work_finished: true, additional_intervention_required: false, incomplete_reason: '' })

  useEffect(() => { if (mission) { setProgress(Number(mission.progress_percent)); setReport({ work_summary: mission.work_summary || '', maalem_observations: mission.maalem_observations || '', work_finished: mission.work_finished == null ? true : Boolean(mission.work_finished), additional_intervention_required: Boolean(mission.additional_intervention_required), incomplete_reason: mission.incomplete_reason || '' }) } }, [mission])

  async function run(action: () => Promise<unknown>, success: string) { setFeedback(''); try { await action(); setFeedback(success); await query.refetch() } catch (error) { setFeedback(message(error)) } }

  async function uploadPhotos(files: FileList | null, phase: string) {
    if (!files?.length) return
    const body = new FormData(); body.append('phase', phase); Array.from(files).forEach((file) => body.append('photos', file))
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/maalem-missions/${id}/photos`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body })
    if (!response.ok) { const value = await response.json().catch(() => ({})); setFeedback(value.message || 'Envoi impossible'); return }
    setFeedback('Photos ajoutées à la mission.'); await query.refetch()
  }

  async function openPhoto(photoId: number) {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/maalem-missions/${id}/photos/${photoId}`, { headers: { Authorization: `Bearer ${token}` } })
    if (!response.ok) return setFeedback('Photo inaccessible')
    const url = URL.createObjectURL(await response.blob()); window.open(url, '_blank', 'noopener,noreferrer'); window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
  }

  if (query.isLoading) return <ShopPageLayout title="Mission" showHeader={false}><p role="status" className="mx-auto max-w-3xl border-b border-border py-16 text-sm text-muted-foreground">Chargement…</p></ShopPageLayout>
  if (!mission || query.error) return <ShopPageLayout title="Mission" showHeader={false}><p role="alert" className="mx-auto max-w-3xl border-b border-border py-16 text-sm leading-6 text-destructive">Mission introuvable, réaffectée ou accès refusé.</p></ShopPageLayout>
  const next = transitions[mission.status]
  const NextIcon = next?.icon
  return <ShopPageLayout title={mission.request_number} showHeader={false}>
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 py-4 lg:grid-cols-4 lg:gap-10"><AccountSidebar active="maalem" /><main className="min-w-0 space-y-6 rounded-3xl bg-[#fbf8ef] p-4 sm:p-6 lg:col-span-3 dark:bg-muted/20">
      <Link href={`/${locale}/profile/maalem/missions`} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300"><ArrowLeft className="size-4 rtl:rotate-180" />Mes missions</Link>
      <Card className="gap-5 rounded-none border-0 border-b bg-transparent pb-8 shadow-[0_8px_28px_-20px_rgba(85,62,20,.35)]"><CardHeader className="px-0"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">{mission.request_number}</p><h1 className="mt-2 text-3xl font-bold tracking-tight rtl:tracking-normal">{mission.service_name || mission.category_name || 'Intervention'}</h1></div><Badge variant="outline" className="max-w-full whitespace-normal rounded-md border-emerald-900/15 bg-emerald-50 text-emerald-900 dark:border-emerald-300/20 dark:bg-emerald-950/30 dark:text-emerald-200">{labels[mission.status]}</Badge></div></CardHeader><CardContent className="space-y-4 px-0">
        {feedback && <p className="border-s-2 border-amber-500 bg-muted/30 p-4 text-sm leading-6 text-foreground">{feedback}</p>}
        <div className="grid gap-3 text-sm sm:grid-cols-2"><p><strong>Date :</strong> {mission.planned_date?.slice(0, 10)} · {mission.planned_time_slot}</p><p><strong>Ville :</strong> {mission.mission_city}</p><p className="sm:col-span-2"><strong>Adresse :</strong> {mission.mission_address}</p><p><strong>Contact :</strong> {mission.mission_contact_name}</p><a className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300" href={`tel:${mission.mission_contact_phone}`}><Phone className="size-4" />{mission.mission_contact_phone}</a></div>
        {mission.mission_description && <div className="border-t border-border pt-5 text-sm leading-7"><strong>Mission :</strong><p className="mt-1 whitespace-pre-wrap">{mission.mission_description}</p></div>}
        {mission.latitude != null && <a target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300" href={`https://www.google.com/maps?q=${mission.latitude},${mission.longitude}`}><MapPin className="size-4" />Ouvrir la localisation</a>}
        {mission.shared_instructions && <div className="border-t border-border pt-5 text-sm leading-7"><strong>Instructions :</strong><p className="mt-1 whitespace-pre-wrap">{mission.shared_instructions}</p></div>}
        {mission.special_information && <div className="border-s-2 border-amber-500 ps-4 text-sm leading-7 text-foreground"><strong>Information particulière :</strong><p className="mt-1 whitespace-pre-wrap">{mission.special_information}</p></div>}
        {mission.status === 'scheduled' && <p className="border-s-2 border-emerald-700 ps-4 text-sm leading-7 text-foreground">La mission est planifiée. Attendez que l’équipe la passe au statut « À faire ».</p>}
        {next && NextIcon && <Button disabled={transitionState.isLoading || (next.status === 'completed' && !report.work_summary.trim())} className="min-h-12 w-full rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" onClick={() => void run(() => transition({ id, status: next.status }).unwrap(), `Statut mis à jour : ${next.label}`)}><NextIcon className="size-4" />{next.label}</Button>}
      </CardContent></Card>

      {['to_do', 'en_route', 'arrived', 'work_in_progress'].includes(mission.status) && <Card className="gap-5 rounded-none border-0 border-b bg-transparent pb-8 shadow-[0_8px_28px_-20px_rgba(85,62,20,.35)]"><CardHeader className="px-0"><h2 className="text-lg font-semibold">Progression</h2></CardHeader><CardContent className="space-y-3 px-0"><div className="flex flex-wrap items-center gap-3"><Input aria-label="Progression de la mission" className="h-11 w-24 rounded-md" type="number" min={0} max={100} step={1} value={progress} onChange={(e) => setProgress(Number(e.target.value))} /><span className="text-lg font-semibold">%</span><Button className="min-h-11 rounded-md" disabled={progressState.isLoading || !Number.isInteger(progress) || progress < 0 || progress > 100} onClick={() => void run(() => updateProgress({ id, progress_percent: progress }).unwrap(), 'Progression enregistrée.')}><Save className="size-4" />Enregistrer</Button></div><p className="text-xs text-muted-foreground">100 % ne termine pas automatiquement la mission.</p></CardContent></Card>}

      {mission.status === 'work_in_progress' && <Card className="gap-5 rounded-none border-0 border-b bg-transparent pb-8 shadow-[0_8px_28px_-20px_rgba(85,62,20,.35)]"><CardHeader className="px-0"><h2 className="text-lg font-semibold">Compte-rendu obligatoire</h2></CardHeader><CardContent className="space-y-4 px-0"><div><Label htmlFor="mission-work-summary">Résumé du travail *</Label><Textarea id="mission-work-summary" className="mt-2" rows={4} value={report.work_summary} onChange={(e) => setReport({ ...report, work_summary: e.target.value })} /></div><div><Label htmlFor="mission-observations">Observations</Label><Textarea id="mission-observations" className="mt-2" rows={3} value={report.maalem_observations} onChange={(e) => setReport({ ...report, maalem_observations: e.target.value })} /></div><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={report.work_finished} onChange={(e) => setReport({ ...report, work_finished: e.target.checked })} />Travail terminé</label><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={report.additional_intervention_required} onChange={(e) => setReport({ ...report, additional_intervention_required: e.target.checked })} />Intervention supplémentaire nécessaire</label>{!report.work_finished && <div><Label htmlFor="mission-incomplete-reason">Motif de non-achèvement *</Label><Textarea id="mission-incomplete-reason" className="mt-2" value={report.incomplete_reason} onChange={(e) => setReport({ ...report, incomplete_reason: e.target.value })} /></div>}<Button className="min-h-11 rounded-md" disabled={reportState.isLoading || !report.work_summary.trim() || (!report.work_finished && !report.incomplete_reason.trim())} onClick={() => void run(() => updateReport({ id, body: { ...report, progress_percent: progress } }).unwrap(), 'Compte-rendu enregistré.')}><Save className="size-4" />Enregistrer le compte-rendu</Button></CardContent></Card>}

      {['to_do', 'en_route', 'arrived', 'work_in_progress', 'completed'].includes(mission.status) && <Card className="gap-5 rounded-none border-0 border-b bg-transparent pb-8 shadow-[0_8px_28px_-20px_rgba(85,62,20,.35)]"><CardHeader className="px-0"><h2 className="flex items-center gap-2 text-lg font-semibold"><Camera className="size-5" />Photos de mission</h2></CardHeader><CardContent className="space-y-4 px-0"><div className="grid gap-2 sm:grid-cols-3">{(['BEFORE', 'DURING', 'AFTER'] as const).map((phase) => <label key={phase} className="relative flex min-h-12 cursor-pointer items-center justify-center rounded-md border border-dashed border-border p-3 text-center text-sm font-medium text-emerald-800 focus-within:ring-2 focus-within:ring-ring dark:text-emerald-300"><input type="file" className="sr-only" multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => { void uploadPhotos(e.target.files, phase); e.target.value = '' }} />Ajouter {phase === 'BEFORE' ? 'avant' : phase === 'DURING' ? 'pendant' : 'après'}</label>)}</div><div className="grid gap-2 sm:grid-cols-2">{query.data?.photos.map((photo) => <button key={photo.id} onClick={() => void openPhoto(photo.id)} className="min-h-11 break-words rounded-md border border-border p-3 text-start text-sm transition hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring"><strong>{photo.phase}</strong> · {photo.original_name}</button>)}</div></CardContent></Card>}
    </main></div>
  </ShopPageLayout>
}

'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, BadgeCheck, Camera, Check, CheckCircle2, Hammer, ImagePlus, Loader2, MapPin, MessageSquare, Pencil,
  Phone, Play, Send, TriangleAlert, Wallet, X,
} from 'lucide-react'
import { AccountSidebar } from '@/components/account/account-sidebar'
import { ShopPageLayout } from '@/components/layout/shop-page-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { API_CONFIG } from '@/lib/api-config'
import {
  appendNote, parseNotes, PROGRESS_STEPS, progressStep, reportBody, simpleStatus, transitionsTo,
} from '@/lib/maalem/mission-flow'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/state/hooks'
import {
  useGetMaalemEarningsQuery, useGetMaalemMissionQuery, useTransitionMaalemMissionMutation,
  useUpdateMaalemMissionProgressMutation, useUpdateMaalemMissionReportMutation,
  type MissionStatus,
} from '@/state/api/maalem-missions-api-slice'

const labels: Record<MissionStatus, string> = {
  assigned: 'À planifier', scheduled: 'Validée par l’équipe', to_do: 'Validée par l’équipe', en_route: 'Validée par l’équipe',
  arrived: 'Validée par l’équipe', work_in_progress: 'Travaux en cours', completed: 'Terminée — en attente de clôture', closed: 'Clôturée',
}
const earningLabel = { pending: 'à venir (mission non clôturée)', available: 'disponible', paid_cash: 'retiré en espèces', to_shop: 'utilisé pour vos achats' } as const

function message(error: unknown) {
  const value = error as { data?: { message?: string; errors?: Record<string, string> }; message?: string }
  return [value.data?.message, ...(value.data?.errors ? Object.values(value.data.errors) : [])].filter(Boolean).join(' · ') || value.message || 'Une erreur est survenue'
}

/** Photos picked in the browser, shown as small thumbnails before they are sent. */
function PhotoPicker({ files, onChange, label }: { files: File[]; onChange: (files: File[]) => void; label: string }) {
  // Preview URLs of the chosen photos, released when the list changes or the picker closes.
  const urls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files])
  useEffect(() => () => urls.forEach((url) => URL.revokeObjectURL(url)), [urls])
  return (
    <div className="flex flex-wrap gap-2">
      {files.map((file, i) => (
        <span key={i} className="relative size-16 overflow-hidden rounded-lg border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
          <img src={urls[i]} alt="" className="size-full object-cover" />
          <button type="button" aria-label="Retirer la photo" onClick={() => onChange(files.filter((_, j) => j !== i))} className="absolute end-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-black/70 text-white"><X className="size-3" /></button>
        </span>
      ))}
      <label className="flex size-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-[10px] font-medium text-muted-foreground hover:bg-muted/40">
        <input type="file" className="sr-only" multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => { onChange([...files, ...Array.from(e.target.files ?? [])].slice(0, 8)); e.target.value = '' }} />
        <Camera className="size-4" />{label}
      </label>
    </div>
  )
}

/**
 * One mission of an approved Maalem, same as in the app: start, progress in three taps (Démarré / En cours / Fini),
 * comments for the team (a comment can be a problem), photos, and the finish with "after" photos and a summary.
 * A finished mission opens read-only; the pencil allows corrections until the team closes it.
 */
export default function MaalemMissionDetailPage() {
  const locale = useLocale()
  const id = Number(useParams<{ id: string }>().id)
  const token = useAppSelector((state) => state.user.accessToken)
  const query = useGetMaalemMissionQuery(id, { skip: !Number.isInteger(id), pollingInterval: 30_000, refetchOnFocus: true, refetchOnReconnect: true })
  const earnings = useGetMaalemEarningsQuery(undefined, { refetchOnMountOrArgChange: true })
  const [transition] = useTransitionMaalemMissionMutation()
  const [updateProgress] = useUpdateMaalemMissionProgressMutation()
  const [updateReport] = useUpdateMaalemMissionReportMutation()

  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [problem, setProblem] = useState(false)
  const [notePhotos, setNotePhotos] = useState<File[]>([])
  const [finishing, setFinishing] = useState(false)
  const [finishPhotos, setFinishPhotos] = useState<File[]>([])
  const [summary, setSummary] = useState<string | null>(null)
  const [extraVisit, setExtraVisit] = useState(false)
  const [editing, setEditing] = useState(false)
  const sentPhotos = useRef(new Set<File>())

  const mission = query.data?.mission
  if (query.isLoading) return <ShopPageLayout title="Mission" showHeader={false}><p role="status" className="mx-auto max-w-3xl py-16 text-sm text-muted-foreground">Chargement…</p></ShopPageLayout>
  if (!mission || query.error) return <ShopPageLayout title="Mission" showHeader={false}><p role="alert" className="mx-auto max-w-3xl py-16 text-sm leading-6 text-destructive">Mission introuvable, réaffectée ou accès refusé.</p></ShopPageLayout>

  const m = mission
  const simple = simpleStatus(m.status)
  const started = simple === 'started'
  const isDone = simple === 'finished'
  const canEdit = m.status === 'completed'
  const composing = started || (canEdit && editing)
  const savedProgress = Number(m.progress_percent) || 0
  const shownProgress = progress ?? savedProgress
  const step = progressStep(shownProgress)
  const notes = parseNotes(m.maalem_observations)
  const photos = query.data?.photos ?? []
  const hasAfterPhotos = photos.some((p) => p.phase === 'AFTER')
  const finishSummary = summary ?? m.work_summary ?? ''
  const earning = earnings.data?.earnings.find((e) => e.service_request_id === m.service_request_id)
  const money = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'MAD' }).format(value)

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true); setNotice(null)
    try { await action(); setNotice({ ok: true, text: success }); await query.refetch() }
    catch (error) { setNotice({ ok: false, text: message(error) }) }
    finally { setBusy(false) }
  }

  async function upload(files: File[], phase: 'DURING' | 'AFTER') {
    if (!files.length) return
    const body = new FormData(); body.append('phase', phase); files.forEach((file) => body.append('photos', file))
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/maalem-missions/${m.id}/photos`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body })
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Envoi des photos impossible')
  }

  const start = () => {
    if (!window.confirm('Démarrer les travaux ? L’équipe et le client verront que vous avez commencé.')) return
    void run(async () => {
      for (const status of transitionsTo(m.status, 'work_in_progress')) await transition({ id: m.id, status }).unwrap()
      const begun = PROGRESS_STEPS[0].value
      if (savedProgress < begun) { await updateProgress({ id: m.id, progress_percent: begun }).unwrap(); setProgress(begun) }
    }, 'Travaux démarrés.')
  }

  const setProgressTo = (value: number) => {
    setProgress(value)
    void run(() => updateProgress({ id: m.id, progress_percent: value }).unwrap(), `Progression enregistrée : ${value} %.`)
  }

  const sendNote = () => {
    const text = note.trim()
    if (!text) return
    const withPhoto = notePhotos.length > 0
    void run(async () => {
      await upload(notePhotos, 'DURING')
      // Until the finish, the first comment also stands as the summary the server requires.
      await updateReport({ id: m.id, body: reportBody(m, shownProgress, { observations: appendNote(m.maalem_observations, text, withPhoto, new Date(), problem), summary: m.work_summary?.trim() || text }) }).unwrap()
      setNote(''); setNotePhotos([]); setProblem(false)
    }, problem ? 'Problème signalé à l’équipe.' : 'Commentaire envoyé à l’équipe.')
  }

  const finish = () => {
    if (!finishPhotos.length && !hasAfterPhotos) return setNotice({ ok: false, text: 'Ajoutez au moins une photo du travail terminé.' })
    if (!finishSummary.trim()) return setNotice({ ok: false, text: 'Écrivez un court résumé du travail fait.' })
    void run(async () => {
      await updateReport({ id: m.id, body: reportBody(m, shownProgress, { summary: finishSummary, progress: 100, finished: true, extraVisit }) }).unwrap()
      const toSend = finishPhotos.filter((f) => !sentPhotos.current.has(f))
      await upload(toSend, 'AFTER')
      toSend.forEach((f) => sentPhotos.current.add(f))
      await transition({ id: m.id, status: 'completed' }).unwrap()
      setFinishing(false); setFinishPhotos([]); sentPhotos.current.clear()
    }, 'Mission terminée : l’équipe et le client sont prévenus.')
  }

  const saveSummary = () => {
    if (!finishSummary.trim()) return setNotice({ ok: false, text: 'Écrivez un court résumé du travail fait.' })
    void run(async () => { await updateReport({ id: m.id, body: reportBody(m, shownProgress, { summary: finishSummary }) }).unwrap(); setSummary(null) }, 'Résumé enregistré.')
  }

  const card = 'rounded-2xl border border-border bg-card p-5 shadow-[0_8px_28px_-20px_rgba(85,62,20,.35)]'

  return <ShopPageLayout title={m.request_number} showHeader={false}>
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 py-4 lg:grid-cols-4 lg:gap-10"><AccountSidebar active="maalem" /><main className="min-w-0 space-y-5 rounded-3xl bg-[#fbf8ef] p-4 sm:p-6 lg:col-span-3 dark:bg-muted/20">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/${locale}/profile/maalem/missions`} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300"><ArrowLeft className="size-4 rtl:rotate-180" />Mes missions</Link>
        {canEdit && <Button type="button" variant={editing ? 'default' : 'outline'} size="sm" className="gap-2 rounded-full" onClick={() => setEditing((e) => !e)}>{editing ? <Check className="size-4" /> : <Pencil className="size-4" />}{editing ? 'Terminer les corrections' : 'Modifier'}</Button>}
      </div>

      {/* Mission */}
      <section className={card}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-xs text-muted-foreground">{m.request_number}</p><h1 className="mt-1 text-2xl font-bold tracking-tight rtl:tracking-normal">{m.service_name || m.category_name || 'Intervention'}</h1></div>
          <Badge variant="outline" className={cn('rounded-md', started && shownProgress >= 100 ? 'border-red-300 bg-red-50 text-red-800' : 'border-emerald-900/15 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200')}>{started && shownProgress >= 100 ? 'À terminer' : labels[m.status] ?? m.status}</Badge>
        </div>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <p><strong>Date :</strong> {m.planned_date?.slice(0, 10) || 'À convenir'} · {m.planned_time_slot || 'Créneau à convenir'}</p>
          <p><strong>Lieu :</strong> {[m.mission_address, m.mission_city].filter(Boolean).join(', ') || '—'}</p>
          {m.mission_contact_name && <p><strong>Contact :</strong> {m.mission_contact_name}</p>}
          {m.mission_contact_phone && <a className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300" href={`tel:${m.mission_contact_phone}`}><Phone className="size-4" />{m.mission_contact_phone}</a>}
          {m.latitude != null && <a target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300" href={`https://www.google.com/maps?q=${m.latitude},${m.longitude}`}><MapPin className="size-4" />Ouvrir la localisation</a>}
        </div>
        {earning && <Link href={`/${locale}/profile/maalem/earnings`} className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-200"><Wallet className="size-4" />Votre montant : {money(earning.amount)} · {earningLabel[earning.state]}</Link>}
        {m.mission_description && <p className="mt-4 whitespace-pre-wrap border-t border-border pt-4 text-sm leading-7">{m.mission_description}</p>}
        {m.shared_instructions && <div className="mt-4 border-s-2 border-emerald-700 ps-4 text-sm leading-7"><strong>Instructions de l’équipe :</strong><p className="mt-1 whitespace-pre-wrap">{m.shared_instructions}</p></div>}
        {m.special_information && <div className="mt-4 border-s-2 border-amber-500 ps-4 text-sm leading-7"><strong>Information particulière :</strong><p className="mt-1 whitespace-pre-wrap">{m.special_information}</p></div>}
      </section>

      {notice && <p role="status" className={cn('rounded-xl px-4 py-3 text-sm', notice.ok ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200' : 'bg-destructive/10 text-destructive')}>{notice.text}</p>}

      {/* Progress / finished */}
      {isDone ? (
        <section className={card}>
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"><CheckCircle2 className="size-6 shrink-0" /><div><p className="font-semibold">Mission terminée</p><p className="text-sm opacity-80">{m.status === 'closed' ? 'Clôturée par l’équipe.' : 'En attente de la validation de l’équipe et du client.'}</p></div></div>
          {canEdit && editing ? (
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium">Résumé du travail<Textarea className="mt-2" rows={4} value={finishSummary} onChange={(e) => setSummary(e.target.value)} /></label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" disabled={busy} className="gap-2" onClick={saveSummary}><Check className="size-4" />Enregistrer le résumé</Button>
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted/40"><input type="file" className="sr-only" multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => { const files = Array.from(e.target.files ?? []); e.target.value = ''; void run(() => upload(files, 'AFTER'), 'Photos ajoutées.') }} /><ImagePlus className="size-4" />Ajouter des photos</label>
              </div>
            </div>
          ) : m.work_summary ? <p className="mt-4 whitespace-pre-wrap text-sm leading-7"><strong>Résumé :</strong> {m.work_summary}</p> : null}
        </section>
      ) : (
        <section className={card}>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Hammer className="size-5" />Progression</h2>
          {simple === 'waiting' && <p className="mt-3 text-sm text-muted-foreground">Mission affectée : l’équipe vous communiquera le rendez-vous, puis vous pourrez démarrer.</p>}
          {simple === 'not_started' && <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"><BadgeCheck className="size-4" />Validée par l’équipe : vous pouvez démarrer</p>}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {PROGRESS_STEPS.map((s, index) => {
              // Lit: "Démarré" once the work began, "En cours" from 50 %, "Fini" at 100 %.
              const done = started && (index === 0 || (index === 1 && (step === 'halfway' || step === 'done')) || (index === 2 && step === 'done'))
              // "Démarré" starts the work; "En cours" and "Fini" (which opens the finish) stay tappable while working.
              const tappable = !busy && (index === 0 ? simple === 'not_started' : started)
              return (
                <button key={s.key} type="button" disabled={!tappable} aria-pressed={done}
                  onClick={() => (index === 0 ? start() : index === 1 ? setProgressTo(50) : setFinishing(true))}
                  className={cn('flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-3 text-sm font-semibold transition-colors disabled:opacity-50',
                    done ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200' : 'border-transparent bg-muted/50 hover:bg-muted')}>
                  {index === 0 ? <Play className="size-5" /> : index === 1 ? <Loader2 className="size-5" /> : <CheckCircle2 className="size-5" />}
                  {s.label}
                </button>
              )
            })}
          </div>
          {started && shownProgress >= 100 && !finishing && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800">Le travail est à 100 % : appuyez sur « Fini » pour envoyer les photos et terminer la mission.</p>}
          {finishing && started && (
            <div className="mt-5 space-y-4 rounded-xl border border-amber-300 p-4">
              <p className="font-semibold">Terminer la mission</p>
              <div><p className="mb-2 text-sm text-muted-foreground">Photos du travail terminé {hasAfterPhotos ? '(déjà envoyées : vous pouvez en ajouter)' : '(au moins une)'}</p><PhotoPicker files={finishPhotos} onChange={setFinishPhotos} label="Photo" /></div>
              <label className="block text-sm font-medium">Résumé du travail *<Textarea className="mt-2" rows={3} value={finishSummary} onChange={(e) => setSummary(e.target.value)} placeholder="Ex. joint changé, fuite réparée" /></label>
              <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={extraVisit} onChange={(e) => setExtraVisit(e.target.checked)} />Une autre intervention sera nécessaire</label>
              <div className="flex flex-wrap gap-2"><Button type="button" disabled={busy} className="gap-2" onClick={finish}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}Terminer et envoyer</Button><Button type="button" variant="outline" onClick={() => setFinishing(false)}>Annuler</Button></div>
            </div>
          )}
        </section>
      )}

      {/* Comments for the team */}
      {(composing || notes.length > 0) && (
        <section className={card}>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><MessageSquare className="size-5" />Commentaires pour l’équipe</h2>
          {composing && (
            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                <button type="button" onClick={() => setProblem(false)} className={cn('flex-1 rounded-xl border-2 px-3 py-2 text-sm font-semibold', !problem ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200' : 'border-transparent bg-muted/50')}>Commentaire</button>
                <button type="button" onClick={() => setProblem(true)} className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-2 text-sm font-semibold', problem ? 'border-red-500 bg-red-50 text-red-800' : 'border-transparent bg-muted/50')}><TriangleAlert className="size-4" />Problème</button>
              </div>
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={problem ? 'Décrivez le problème (pièce manquante, accès impossible…)' : 'Un mot pour l’équipe'} />
              <PhotoPicker files={notePhotos} onChange={setNotePhotos} label="Photo" />
              <Button type="button" disabled={busy || !note.trim()} variant={problem ? 'destructive' : 'default'} className="gap-2" onClick={sendNote}><Send className="size-4" />{problem ? 'Signaler le problème' : 'Envoyer'}</Button>
            </div>
          )}
          <ul className="mt-4 space-y-2">
            {notes.map((n, i) => (
              <li key={i} className={cn('rounded-xl border p-3 text-sm', n.problem ? 'border-red-200 bg-red-50 text-red-900' : 'border-border bg-muted/30')}>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">{n.problem && <span className="rounded-full bg-red-600 px-2 py-0.5 font-bold text-white">Problème</span>}{n.at}{n.photo && <span className="inline-flex items-center gap-1"><Camera className="size-3" />photo</span>}</div>
                <p className="mt-1 whitespace-pre-wrap">{n.text}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <section className={card}>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Camera className="size-5" />Photos de la mission</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">{photos.map((photo) => <button key={photo.id} type="button" onClick={() => void (async () => {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/maalem-missions/${m.id}/photos/${photo.id}`, { headers: { Authorization: `Bearer ${token}` } })
            if (!response.ok) return setNotice({ ok: false, text: 'Photo inaccessible' })
            const url = URL.createObjectURL(await response.blob()); window.open(url, '_blank', 'noopener,noreferrer'); window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
          })()} className="min-h-11 break-words rounded-lg border border-border p-3 text-start text-sm hover:bg-muted/30"><strong>{photo.phase === 'BEFORE' ? 'Avant' : photo.phase === 'DURING' ? 'Pendant' : 'Après'}</strong> · {photo.original_name}</button>)}</div>
        </section>
      )}
    </main></div>
  </ShopPageLayout>
}

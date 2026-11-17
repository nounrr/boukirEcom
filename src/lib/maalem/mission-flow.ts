/**
 * The Maalem's mission, kept simple (same rules as the mobile app):
 * not started → started (work in progress) → finished (photos + summary) → closed by the team.
 * Comments go into the report's observations as dated lines, which the back-office shows;
 * a comment can be flagged as a problem the team must act on.
 */

export type SimpleStatus = 'waiting' | 'not_started' | 'started' | 'finished'

/** The server's steps a Maalem goes through, in order. */
const STEPS = ['en_route', 'arrived', 'work_in_progress', 'completed'] as const
export type ServerStep = (typeof STEPS)[number]
const POSITION: Record<string, number> = { scheduled: -1, to_do: -1, en_route: 0, arrived: 1, work_in_progress: 2, completed: 3 }

/** Assigned but not scheduled yet: the team still has to fix the appointment. */
export function simpleStatus(status: string): SimpleStatus {
  if (status === 'work_in_progress') return 'started'
  if (status === 'completed' || status === 'closed') return 'finished'
  if (status in POSITION) return 'not_started'
  return 'waiting'
}

/** The server transitions to send, in order, to reach `target` from `status` (empty when not allowed or already there). */
export function transitionsTo(status: string, target: ServerStep): ServerStep[] {
  const from = POSITION[status]
  const to = STEPS.indexOf(target)
  if (from === undefined || to <= from) return []
  return STEPS.slice(from + 1, to + 1) as ServerStep[]
}

/** The three progress steps the Maalem taps (no percent typing). */
export const PROGRESS_STEPS = [
  { key: 'begun', value: 10, label: 'Démarré' },
  { key: 'halfway', value: 50, label: 'En cours' },
  { key: 'done', value: 100, label: 'Fini' },
] as const

export function progressStep(percent: number): 'begun' | 'halfway' | 'done' | null {
  if (percent >= 100) return 'done'
  if (percent >= 50) return 'halfway'
  if (percent > 0) return 'begun'
  return null
}

/** What the server needs while the work is not finished (a reason is required then). */
export const IN_PROGRESS_REASON = 'Travaux en cours'
export const PROBLEM_MARK = 'PROBLÈME : '
export const PHOTO_MARK = ' (photo jointe)'

export type MissionNote = { at: string; text: string; photo: boolean; problem: boolean }

const LINE = /^\[(\d{2}\/\d{2} \d{2}:\d{2})\]\s?(.*)$/

/** The comments, newest first. */
export function parseNotes(observations: string | null | undefined): MissionNote[] {
  const notes: MissionNote[] = []
  for (const raw of (observations ?? '').split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const m = LINE.exec(line)
    let body = m ? m[2] : line
    const problem = body.startsWith(PROBLEM_MARK)
    if (problem) body = body.slice(PROBLEM_MARK.length)
    const photo = body.endsWith(PHOTO_MARK.trim())
    notes.push({ at: m ? m[1] : '', text: photo ? body.slice(0, -PHOTO_MARK.trim().length).trim() : body, photo, problem })
  }
  return notes.reverse()
}

const pad = (n: number) => String(n).padStart(2, '0')
export const noteStamp = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`

export function appendNote(observations: string | null | undefined, text: string, photo: boolean, now = new Date(), problem = false): string {
  const line = `[${noteStamp(now)}] ${problem ? PROBLEM_MARK : ''}${text.trim().replace(/\s*\n\s*/g, ' ')}${photo ? PHOTO_MARK : ''}`
  const current = (observations ?? '').trim()
  return current ? `${current}\n${line}` : line
}

const yes = (v: unknown) => v === true || v === 1 || v === '1'

/**
 * The report to save. The server wants a summary and, until the end, a reason the work is not finished;
 * a correction to a finished mission keeps it finished at 100 %.
 */
export function reportBody(
  mission: { status: string; work_summary: string | null; maalem_observations: string | null; additional_intervention_required: unknown },
  progress: number,
  over: { observations?: string | null; summary?: string; progress?: number; finished?: boolean; extraVisit?: boolean } = {},
) {
  const isDone = simpleStatus(mission.status) === 'finished'
  const finished = over.finished ?? isDone
  return {
    work_summary: (over.summary ?? mission.work_summary ?? '').trim(),
    maalem_observations: over.observations !== undefined ? over.observations : mission.maalem_observations ?? null,
    progress_percent: over.progress ?? (isDone ? 100 : progress),
    work_finished: finished,
    additional_intervention_required: finished && !isDone ? Boolean(over.extraVisit) : yes(mission.additional_intervention_required),
    incomplete_reason: finished ? null : IN_PROGRESS_REASON,
  }
}

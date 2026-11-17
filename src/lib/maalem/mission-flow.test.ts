import assert from 'node:assert/strict'
import test from 'node:test'

import { appendNote, parseNotes, progressStep, reportBody, simpleStatus, transitionsTo } from './mission-flow.ts'

test('statuses fold into four simple ones', () => {
  assert.equal(simpleStatus('assigned'), 'waiting')
  assert.equal(simpleStatus('scheduled'), 'not_started')
  assert.equal(simpleStatus('arrived'), 'not_started')
  assert.equal(simpleStatus('work_in_progress'), 'started')
  assert.equal(simpleStatus('closed'), 'finished')
})

test('starting sends each step the server needs, in order', () => {
  assert.deepEqual(transitionsTo('scheduled', 'work_in_progress'), ['en_route', 'arrived', 'work_in_progress'])
  assert.deepEqual(transitionsTo('arrived', 'work_in_progress'), ['work_in_progress'])
  assert.deepEqual(transitionsTo('assigned', 'work_in_progress'), []) // no appointment yet
  assert.deepEqual(transitionsTo('completed', 'work_in_progress'), [])
})

test('comments keep date, problem flag and photo, newest first', () => {
  const now = new Date(2026, 10, 17, 9, 5)
  let obs = appendNote(null, 'Arrivé, je commence', false, now)
  obs = appendNote(obs, 'Tuyau cassé\nà changer', true, now, true)
  assert.equal(obs, '[17/11 09:05] Arrivé, je commence\n[17/11 09:05] PROBLÈME : Tuyau cassé à changer (photo jointe)')
  assert.deepEqual(parseNotes(obs)[0], { at: '17/11 09:05', text: 'Tuyau cassé à changer', photo: true, problem: true })
  assert.equal(parseNotes(obs)[1].problem, false)
})

test('progress steps', () => {
  assert.deepEqual([0, 10, 49, 50, 100].map(progressStep), [null, 'begun', 'begun', 'halfway', 'done'])
})

test('the report: in progress needs a reason, a finished mission stays finished at 100 %', () => {
  const working = { status: 'work_in_progress', work_summary: null, maalem_observations: null, additional_intervention_required: 0 }
  assert.deepEqual(reportBody(working, 50, { summary: 'Début' }), {
    work_summary: 'Début', maalem_observations: null, progress_percent: 50, work_finished: false,
    additional_intervention_required: false, incomplete_reason: 'Travaux en cours',
  })
  const finishing = reportBody(working, 50, { summary: 'Fait', progress: 100, finished: true, extraVisit: true })
  assert.equal(finishing.work_finished, true)
  assert.equal(finishing.incomplete_reason, null)
  assert.equal(finishing.additional_intervention_required, true)
  const done = { ...working, status: 'completed', work_summary: 'Fait', additional_intervention_required: 1 }
  const correction = reportBody(done, 40, { summary: 'Fait, joint changé' })
  assert.equal(correction.progress_percent, 100)
  assert.equal(correction.work_finished, true)
  assert.equal(correction.additional_intervention_required, true)
})

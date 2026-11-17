import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { requestState } from './request-status.ts'

test('statuses read like in the app', () => {
  assert.equal(requestState('new')?.key, 'new')
  assert.equal(requestState('to_do')?.key, 'scheduled')
  assert.equal(requestState('completed')?.key, 'toValidate')
  assert.equal(requestState('closed')?.key, 'closed')
  assert.equal(requestState('rejected')?.color, '#D93F3F')
  assert.equal(requestState('something_new'), null)
})

test('every state and the list texts exist in the 4 languages', () => {
  const statuses = ['new', 'to_contact', 'processing', 'qualified', 'waiting_customer', 'confirmed', 'assigned', 'scheduled', 'to_do',
    'en_route', 'arrived', 'work_in_progress', 'in_progress', 'completed', 'closed', 'cancelled', 'rejected']
  for (const locale of ['fr', 'en', 'ar', 'zh']) {
    const messages = JSON.parse(readFileSync(new URL(`../../messages/${locale}.json`, import.meta.url), 'utf8'))
    const tracking = messages.serviceRequests.tracking
    for (const status of statuses) assert.ok(tracking.state[requestState(status)!.key], `${locale}: ${status}`)
    for (const key of ['listTitle', 'listSubtitle', 'newRequest', 'wishedOn', 'sentOn', 'copy', 'emptyTitle', 'authTitle', 'loadError',
      'notFound', 'notFoundDescription', 'loadErrorDescription', 'teamMessage', 'backToList']) {
      assert.ok(tracking[key], `${locale}: ${key}`)
    }
    for (const source of ['quick_request', 'selected_service', 'selected_maalem']) assert.ok(tracking.source[source], `${locale}: ${source}`)
  }
})

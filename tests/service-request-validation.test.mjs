import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getTodayForDateInput,
  validateServiceRequest,
} from '../src/lib/service-request-validation.ts'

const messages = new Proxy({}, { get: (_, key) => String(key) })
const valid = {
  problemDescription: 'Fuite sous le lavabo',
  contactPhone: '+212600000000',
  city: 'Casablanca',
  address: '12 rue des Artisans',
  latitude: null,
  longitude: null,
  desiredDate: '2026-08-09',
  desiredTimeSlot: '',
  sharedNote: '',
  photos: [],
}

test('accepts a complete selected-Maalem request', () => {
  assert.deepEqual(validateServiceRequest(valid, messages, new Date(2026, 7, 9)), {})
})

test('requires description, phone, city and intervention address', () => {
  const errors = validateServiceRequest({
    ...valid,
    problemDescription: ' ',
    contactPhone: '',
    city: '',
    address: '',
  }, messages, new Date(2026, 7, 9))
  assert.deepEqual(errors, {
    problemDescription: 'descriptionRequired',
    contactPhone: 'phoneRequired',
    city: 'cityRequired',
    address: 'addressRequired',
  })
})

test('quick request keeps the detailed address optional', () => {
  const errors = validateServiceRequest(
    { ...valid, address: '' },
    messages,
    new Date(2026, 7, 9),
    { addressRequired: false },
  )
  assert.deepEqual(errors, {})
})

test('rejects a past date using the local calendar date', () => {
  const errors = validateServiceRequest(
    { ...valid, desiredDate: '2026-08-08' },
    messages,
    new Date(2026, 7, 9, 23, 30),
  )
  assert.equal(errors.desiredDate, 'datePast')
  assert.equal(getTodayForDateInput(new Date(2026, 7, 9, 23, 30)), '2026-08-09')
})

test('requires GPS coordinates as a valid pair', () => {
  const missingPair = validateServiceRequest({ ...valid, latitude: 33.5 }, messages)
  assert.equal(missingPair.longitude, 'gpsPair')
  const outOfRange = validateServiceRequest({ ...valid, latitude: 93, longitude: -7 }, messages)
  assert.equal(outOfRange.latitude, 'gpsInvalid')
})

test('rejects invalid photo formats and oversized photos', () => {
  const invalid = new File(['x'], 'photo.gif', { type: 'image/gif' })
  const errors = validateServiceRequest({ ...valid, photos: [invalid] }, messages)
  assert.equal(errors.photos, 'photoInvalid')
})

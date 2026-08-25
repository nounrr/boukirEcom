import test from 'node:test'
import assert from 'node:assert/strict'

import { buildMaalemProfileJsonLd } from './maalem-profile-json-ld.ts'

const BASE = {
  profileUrl: 'https://example.test/fr/maalems/9',
  publicName: 'Maalem Public',
  photoUrl: null,
  category: 'Plombier',
  skills: ['Fuites'],
  interventionAreas: ['Rabat'],
  ratedServiceName: 'Interventions réalisées par Maalem Public',
}

test('le JSON-LD sans avis ne contient aucune note agrégée', () => {
  const value = buildMaalemProfileJsonLd({ ...BASE, averageRating: null, reviewCount: 0 })
  assert.equal(JSON.stringify(value).includes('aggregateRating'), false)
  assert.deepEqual(value['@graph'].map((item) => item['@type']), ['ProfilePage', 'Person'])
})

test('le JSON-LD avec avis rattache la note exacte à un Service distinct du Person', () => {
  const value = buildMaalemProfileJsonLd({ ...BASE, averageRating: 4.67, reviewCount: 3 })
  const service = value['@graph'].find((item) => item['@type'] === 'Service')
  const person = value['@graph'].find((item) => item['@type'] === 'Person')
  assert.deepEqual(service?.aggregateRating, {
    '@type': 'AggregateRating', ratingValue: 4.67, reviewCount: 3, bestRating: 5, worstRating: 1,
  })
  assert.equal(Object.hasOwn(person || {}, 'aggregateRating'), false)
})

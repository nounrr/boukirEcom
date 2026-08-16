import test from 'node:test'
import assert from 'node:assert/strict'

import {
  catalogueHref,
  localizedCategoryName,
  localizedServiceText,
  quickServiceRequestHref,
  serviceDetailHref,
  serviceRequestHref,
  serviceMaalemRequestHref,
} from './service-catalog.ts'

const service = {
  nom: 'Plomberie',
  nom_ar: 'السباكة',
  description: 'Réparer une fuite',
  description_ar: 'إصلاح تسرب',
}

test('sélectionne correctement les contenus français et arabes avec repli', () => {
  assert.deepEqual(localizedServiceText(service, 'fr'), { name: 'Plomberie', description: 'Réparer une fuite' })
  assert.deepEqual(localizedServiceText(service, 'ar'), { name: 'السباكة', description: 'إصلاح تسرب' })
  assert.equal(localizedServiceText({ ...service, description_ar: null }, 'ar').description, 'Réparer une fuite')
  assert.equal(localizedCategoryName({ id: 1, nom: 'Plombier', nom_ar: 'سباك' }, 'ar'), 'سباك')
})

test('produit les URLs exactes KAN-25, KAN-15 et KAN-16', () => {
  assert.equal(serviceDetailHref('fr', 42), '/fr/services/42')
  assert.equal(serviceRequestHref('ar', 42), '/ar/services/42/request')
  assert.equal(quickServiceRequestHref('fr'), '/fr/services/request/quick')
  assert.equal(serviceMaalemRequestHref('ar', 8, 42), '/ar/service-requests/maalem/8?service_id=42')
})

test('la pagination conserve la recherche et la catégorie', () => {
  assert.equal(
    catalogueHref('fr', { q: ' fuite ', category_id: 3, page: 2 }),
    '/fr/services?q=fuite&category_id=3&page=2',
  )
})

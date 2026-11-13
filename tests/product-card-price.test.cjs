const test = require('node:test')
const assert = require('node:assert/strict')
require('../scripts/register-project.cjs')
const { isRequiredVariant, resolveCardVariant, resolveCardPrice } = require('../src/lib/product-card-price.ts')

const product = {
  price: 0,
  isVariantRequired: true,
  variants: [{ id: 7, prix_vente: 85 }, { id: 8, prix_vente: 120 }],
}

test('required cards show the first variant immediately instead of zero or the parent price', () => {
  for (const price of [0, 999]) {
    assert.equal(resolveCardVariant({ ...product, price }, null).id, 7)
    assert.equal(resolveCardPrice({ ...product, price }, null).price, 85)
  }
  assert.equal(resolveCardPrice(product, 99).price, 85, 'stale selections fall back before an effect runs')
  assert.equal(resolveCardPrice(product, 8).price, 120)
})

test('the first variant wins even when another variant is cheaper', () => {
  assert.equal(resolveCardPrice({ ...product, variants: [{ id: 1, prix_vente: 130 }, { id: 2, prix_vente: 60 }] }, null).price, 130)
})

test('promotions apply once to the variant and use its own original price', () => {
  assert.deepEqual(resolveCardPrice({ ...product, price: 10, originalPrice: 999, sale: { discount: 10 } }, null), { price: 76.5, originalPrice: 85 })
  assert.equal(resolveCardPrice({ ...product, sale: { discount: 100 } }, null).price, 85)
})

test('mandatory variants without a price never show the parent price or zero', () => {
  for (const value of [0, null, undefined, 'bad']) {
    assert.deepEqual(resolveCardPrice({ ...product, price: 999, variants: [{ id: 7, prix_vente: value }] }, null), { price: null, originalPrice: null })
  }
  assert.equal(resolveCardPrice({ ...product, variants: [] }, null).price, null)
  assert.equal(resolveCardPrice({ ...product, variants: [{ id: 7, prix_vente: '85.00' }] }, null).price, 85)
})

test('optional variants preserve the parent offer until selected', () => {
  const optional = { ...product, isVariantRequired: false, price: 45, originalPrice: 50 }
  assert.equal(resolveCardVariant(optional, null), undefined)
  assert.deepEqual(resolveCardPrice(optional, null), { price: 45, originalPrice: 50 })
  assert.equal(resolveCardPrice(optional, 8).price, 120)
})

test('required flags support boolean and database representations', () => {
  for (const flag of [true, 1, '1']) assert.equal(isRequiredVariant(flag), true)
  for (const flag of [false, 0, '0', null, undefined]) assert.equal(isRequiredVariant(flag), false)
  assert.equal(isRequiredVariant(undefined, 1), true)
})

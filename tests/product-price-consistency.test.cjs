const test = require('node:test')
const assert = require('node:assert/strict')
require('../scripts/register-project.cjs')

const { resolveProductOfferPrice } = require('../src/lib/product-price.ts')
const { mergeProductSessionState } = require('../src/lib/product-client-snapshot.ts')
const { getPublicProduct, productCacheTag, PRODUCT_CACHE_SECONDS } = require('../src/lib/seo/product.ts')

const baseProduct = {
  id: 6696,
  designation: 'DANOSA 4 mm Vert Rouleau Bitume',
  prix_vente: 89.78,
  prix_promo: null,
  pourcentage_promo: 0,
  has_promo: false,
  variants: [],
  units: [],
  similar_products: [],
}

test('base, promotion, variant and unit use one price resolver', () => {
  assert.deepEqual(resolveProductOfferPrice(baseProduct), {
    listPrice: 89.78, price: 89.78, discountPercentage: 0, onPromotion: false,
  })

  const promoted = { ...baseProduct, prix_vente: 100, prix_promo: 90, pourcentage_promo: 10, has_promo: true }
  assert.equal(resolveProductOfferPrice(promoted).price, 90)
  assert.equal(resolveProductOfferPrice(promoted, { variant: { prix_vente: 120 } }).price, 108)
  assert.equal(resolveProductOfferPrice(promoted, { unit: { prix_vente: 500, conversion_factor: 5 } }).price, 450)
  assert.equal(resolveProductOfferPrice(promoted, {
    variant: { prix_vente: 120 }, unit: { prix_vente: 500, conversion_factor: 5 },
  }).price, 540)
})

test('zero/invalid offers are omitted and stale promo fields are ignored', () => {
  assert.equal(resolveProductOfferPrice({ ...baseProduct, prix_vente: 0 }).price, null)
  assert.equal(resolveProductOfferPrice({ ...baseProduct, prix_vente: 'bad' }).price, null)
  assert.equal(resolveProductOfferPrice({ ...baseProduct, prix_promo: 1, has_promo: false }).price, 89.78)
})

test('browser refresh can update wishlist state without replacing the rendered commercial snapshot', () => {
  const initial = {
    ...baseProduct,
    is_wishlisted: false,
    variants: [{ id: 12, variant_name: 'Vert', prix_vente: 90 }],
  }
  const fresh = {
    ...initial,
    prix_vente: 99,
    is_wishlisted: true,
    variants: [{ id: 12, variant_name: 'Vert', prix_vente: 110 }],
  }
  const merged = mergeProductSessionState(initial, fresh)
  assert.equal(merged.prix_vente, 89.78)
  assert.equal(merged.variants[0].prix_vente, 90)
  assert.equal(merged.is_wishlisted, true)
})

test('server product fetch keeps a bounded TTL and a product-specific invalidation tag', async () => {
  let options
  global.fetch = async (_url, receivedOptions) => {
    options = receivedOptions
    return Response.json({ ...baseProduct, id: 9914 })
  }
  const result = await getPublicProduct('9914')
  assert.equal(result.status, 'found')
  assert.equal(options.next.revalidate, PRODUCT_CACHE_SECONDS)
  assert.deepEqual(options.next.tags, [productCacheTag(9914)])
})


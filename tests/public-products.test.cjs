const test = require('node:test')
const assert = require('node:assert/strict')
require('../scripts/register-project.cjs')

const {
  publicProductDetail,
  publicProductsResponse,
} = require('../src/lib/catalog/public-products.ts')

test('server-cached catalogue data excludes visitor wishlist state at every product level', () => {
  const item = { id: 1, designation: 'Ciment', is_wishlisted: true }
  const detail = publicProductDetail({
    ...item,
    similar_products: [{ ...item, id: 2 }],
    suggestions: [{ ...item, id: 3 }],
  })
  const list = publicProductsResponse({
    products: [item],
    pagination: { total_items: 1 },
    filters: {},
  })

  assert.equal(detail.is_wishlisted, false)
  assert.equal(detail.similar_products[0].is_wishlisted, false)
  assert.equal(detail.suggestions[0].is_wishlisted, false)
  assert.equal(list.products[0].is_wishlisted, false)
  assert.equal(item.is_wishlisted, true, 'sanitizing must not mutate the API object')
})

const test = require('node:test')
const assert = require('node:assert/strict')
require('../scripts/register-project.cjs')
const { catalogRoute, catalogMetadata } = require('../src/lib/catalog/route.tsx')
const { isBrandShopUrl } = require('../src/lib/catalog/shop-brand.ts')
const props = (locale, query = {}, slug = '37-danosa') => ({ params: Promise.resolve({ locale, slug }), searchParams: Promise.resolve(query) })

test('indexed legacy brand pages redirect permanently to shop with brand, page, filters and tracking', async () => {
  for (const locale of ['fr', 'ar', 'en', 'zh']) {
    for (const route of [catalogRoute, catalogMetadata]) {
      await assert.rejects(route('marques', props(locale, { page: '2', utm_source: 'google', brand_id: '38' })), error =>
        error.digest?.includes('308') && error.digest.includes(`/${locale}/shop?brand_id=37&page=2&utm_source=google`))
      await assert.rejects(route('marques', props(locale, { category_id: '75', colors: 'rouge' })), error =>
        error.digest?.includes(`/${locale}/shop?category_id=75&brand_id=37&colors=rouge`))
    }
  }
  await assert.rejects(catalogRoute('marques', props('fr', {}, 'not-a-brand')), error => error.digest?.includes('404'))
})

test('only canonical known brand selections are eligible for brand sitemaps', () => {
  assert.equal(isBrandShopUrl(new URL('https://example.com/fr/shop?brand_id=37')), true)
  for (const path of ['/fr/shop?brand_id=37&search=x', '/fr/shop?brand_id=99999', '/fr/shop?brand_id=037', '/fr/shop?brand_id=37&brand_id=37', '/fr/shop?brand_id=37&page=2', '/fr/product/37?brand_id=37']) {
    assert.equal(isBrandShopUrl(new URL(path, 'https://example.com')), false)
  }
})

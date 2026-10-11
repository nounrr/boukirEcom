const test = require('node:test')
const assert = require('node:assert/strict')
require('../scripts/register-project.cjs')
process.env.ECOM_REVALIDATE_SECRET = 'test-category-order'
process.env.NEXT_PUBLIC_SITE_URL = 'https://boukirdiamond.com'
const paths = []
const cachePath = require.resolve('next/cache')
require.cache[cachePath] = { id: cachePath, filename: cachePath, loaded: true, exports: {
  revalidateTag() {}, revalidatePath(path) { paths.push(path) },
} }
const { POST } = require('../app/internal-seo-cache/revalidate-product/route.ts')
const request = (body, secret = 'test-category-order') => new Request('https://boukirdiamond.com/internal-seo-cache/revalidate-product', {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-revalidation-secret': secret }, body: JSON.stringify(body),
})

test('category ordering expires shop, category and brand catalogues', async () => {
  paths.length = 0
  assert.equal((await POST(request({ productId: 1, categoryId: 7 }))).status, 200)
  assert.ok(paths.includes('/[locale]/(shop)/shop'))
  assert.ok(paths.includes('/[locale]/(shop)/categories/[slug]'))
  assert.ok(paths.includes('/[locale]/(shop)/marques/[slug]'))
})

test('ordinary product updates retain scoped cache invalidation and unauthorized calls cannot expire catalogues', async () => {
  paths.length = 0
  assert.equal((await POST(request({ productId: 1 }))).status, 200)
  assert.deepEqual(paths, ['/[locale]/product/[id]'])
  paths.length = 0
  assert.equal((await POST(request({ productId: 1, categoryId: 7 }, 'wrong'))).status, 401)
  assert.deepEqual(paths, [])
})

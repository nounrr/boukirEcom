import assert from 'node:assert/strict'
import test from 'node:test'
import { getSiteUrl, localizedPath, localizedUrl, seoImageUrl } from '../src/lib/seo/urls.ts'

function environment(t, values) {
  for (const [key, value] of Object.entries(values)) {
    const original = process.env[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
    t.after(() => {
      if (original === undefined) delete process.env[key]
      else process.env[key] = original
    })
  }
}

test('production refuses a missing site origin instead of publishing localhost', t => {
  environment(t, { NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: undefined })
  assert.throws(getSiteUrl, /NEXT_PUBLIC_SITE_URL/)
})

test('production rejects invalid, local, HTTP and non-origin configurations', t => {
  environment(t, { NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: undefined })
  for (const invalid of ['', 'broken', 'http://boukirdiamond.com', 'https://localhost:3000',
    'https://127.0.0.1', 'https://[::1]', 'https://10.1.1.1', 'https://demo.localhost',
    'https://boukirdiamond.com/fr', 'https://boukirdiamond.com?x=1',
    'https://boukirdiamond.com#fr', 'https://user:secret@boukirdiamond.com', 'ftp://boukirdiamond.com']) {
    process.env.NEXT_PUBLIC_SITE_URL = invalid
    assert.throws(getSiteUrl, /NEXT_PUBLIC_SITE_URL/, invalid)
  }
})

test('development uses the actual ecom port and still catches invalid explicit config', t => {
  environment(t, { NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: undefined })
  assert.equal(getSiteUrl().origin, 'http://localhost:3002')
  process.env.NEXT_PUBLIC_SITE_URL = 'invalid'
  assert.throws(getSiteUrl, /NEXT_PUBLIC_SITE_URL/)
})

test('all four locales get self URLs and no duplicated language or trailing slash', t => {
  environment(t, { NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: ' https://boukirdiamond.com/ ' })
  for (const locale of ['fr', 'ar', 'en', 'zh']) {
    assert.equal(localizedUrl(locale, '/'), `https://boukirdiamond.com/${locale}`)
    for (const path of ['/shop/', 'shop', '/fr/shop', '/ar/fr/shop/']) {
      assert.equal(localizedUrl(locale, path), `https://boukirdiamond.com/${locale}/shop`)
    }
    assert.equal(localizedPath(locale, '/fr/shop/?page=2#products'), `/${locale}/shop?page=2#products`)
  }
  assert.throws(() => localizedPath('fr', 'https://other.example/shop'), /application paths/)
  assert.throws(() => localizedPath('fr', '//other.example/shop'), /application paths/)
})

test('site images and stale local upload URLs use the public HTTPS origin', t => {
  environment(t, { NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'https://boukirdiamond.com' })
  for (const value of ['/uploads/p.jpg', 'uploads/p.jpg', 'http://localhost:3001/uploads/p.jpg',
    'http://127.0.0.1:3001/uploads/p.jpg', 'http://www.boukirdiamond.com/uploads/p.jpg']) {
    assert.equal(seoImageUrl(value), 'https://boukirdiamond.com/uploads/p.jpg')
  }
  assert.equal(seoImageUrl('/logo.png'), 'https://boukirdiamond.com/logo.png')
  assert.equal(seoImageUrl('/product-fallbacks/service.webp'), 'https://boukirdiamond.com/product-fallbacks/service.webp')
  assert.equal(seoImageUrl('https://cdn.example.com/p.jpg?w=800'), 'https://cdn.example.com/p.jpg?w=800')
})

test('invalid or insecure external images are omitted rather than emitted into SEO', t => {
  environment(t, { NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'https://boukirdiamond.com' })
  for (const value of [null, '', 'null', 'undefined', 'data:image/png;base64,x', 'javascript:alert(1)',
    'http://cdn.example.com/p.jpg', 'https://user:pass@cdn.example.com/p.jpg']) {
    assert.equal(seoImageUrl(value), null)
  }
})

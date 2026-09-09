import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'

const option = name => process.argv.find(arg => arg.startsWith(`--${name}=`))?.split('=').slice(1).join('=')
const base = option('base') || 'http://127.0.0.1:3012'
const origin = option('origin') || 'https://boukirdiamond.com'
const recordOnly = process.argv.includes('--record-only')
const routes = ['fr', 'ar'].flatMap(locale => ['', '/shop', '/contact', '/product/6376', '/product/6696'].map(p => `/${locale}${p}`))
routes.push('/en', '/zh', '/en/product/6376', '/zh/product/6376')
const decode = value => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
const failures = []
const results = []

for (const route of routes) {
  try {
    const response = await fetch(`${base}${route}`, { redirect: 'manual', signal: AbortSignal.timeout(60000) })
    const html = await response.text()
    const tags = [...html.matchAll(/<(?:meta|link)\b[^>]*>/gi)].map(([tag]) =>
      Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key.toLowerCase(), decode(value)])))
    const canonical = tags.find(t => t.rel === 'canonical')?.href
    const alternates = Object.fromEntries(tags.filter(t => t.rel === 'alternate' && t.hreflang).map(t => [t.hreflang, t.href]))
    const social = Object.fromEntries(tags.filter(t => /^(og:url|og:image(:url|:secure_url)?|twitter:image(:src)?)$/.test(t.property || t.name || '')).map(t => [t.property || t.name, t.content]))
    const schemas = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(m => JSON.parse(m[1]))
    const schemaUrls = []
    function collect(value, key = '') {
      if (Array.isArray(value)) value.forEach(v => collect(v, key))
      else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => collect(v, k))
      else if (typeof value === 'string' && ['@id', 'url', 'image', 'logo', 'contentUrl', 'thumbnailUrl'].includes(key)) schemaUrls.push(value)
    }
    schemas.forEach(value => collect(value))
    const entry = { route, status: response.status, location: response.headers.get('location'), canonical, alternates, social, schemaUrls, schemaTypes: schemas.map(s => s['@type']), errors: [] }
    const check = (fn) => { try { fn() } catch (e) { entry.errors.push(e.message); failures.push(`${route}: ${e.message}`) } }
    check(() => assert.equal(response.status, 200, 'Page must respond directly without a redirect'))
    check(() => assert.equal(canonical, `${origin}${route}`, 'Canonical must match the requested locale/path'))
    for (const locale of ['fr', 'ar', 'en', 'zh']) check(() => assert.equal(alternates[locale], `${origin}${route.replace(/^\/(fr|ar|en|zh)/, `/${locale}`)}`, `Alternate ${locale}`))
    check(() => assert.equal(social['og:url'], canonical, 'og:url must match canonical'))
    check(() => assert.ok(social['og:image'] && social['twitter:image'], 'OG and Twitter images must exist'))
    for (const value of [...Object.values(social), ...schemaUrls]) check(() => {
      const url = new URL(value)
      assert.equal(url.protocol, 'https:', `Non-HTTPS SEO URL: ${value}`)
      assert.ok(!/(localhost|127\.0\.0\.1|\[::1\])/.test(url.hostname), `Local SEO URL: ${value}`)
    })
    if (route.includes('/product/')) check(() => assert.ok(entry.schemaTypes.includes('Product'), 'A real product must load for this check'))
    if (route.endsWith('/contact')) check(() => assert.ok(entry.schemaTypes.includes('LocalBusiness'), 'Contact schema must exist'))
    results.push(entry)
    console.log(`${entry.errors.length ? 'FAIL' : 'PASS'} ${route} (${entry.errors.length} issues)`)
  } catch (error) {
    failures.push(`${route}: ${error.message}`)
    results.push({ route, error: error.message })
    console.log(`ERROR ${route}: ${error.message}`)
  }
}

for (const resource of ['/robots.txt', '/sitemap.xml']) {
  try {
    const response = await fetch(`${base}${resource}`, { signal: AbortSignal.timeout(60000) })
    const body = await response.text()
    const urls = resource.endsWith('.xml')
      ? [...body.matchAll(/(?:<loc>|href=")([^<"]+)/g)].map(m => decode(m[1]))
      : [...body.matchAll(/^Sitemap:\s*(.+)$/gm)].map(m => m[1].trim())
    assert.equal(response.status, 200)
    assert.ok(urls.length > 0, `${resource}: missing URLs`)
    assert.ok(urls.every(url => new URL(url).origin === origin), `${resource}: unexpected URL origin`)
    results.push({ route: resource, status: response.status, urls, errors: [] })
  } catch (error) { failures.push(error.message); results.push({ route: resource, error: error.message }) }
}
const output = option('output') || 'seo-url-check.json'
await fs.mkdir(path.dirname(path.resolve(output)), { recursive: true })
await fs.writeFile(output, JSON.stringify({ capturedAt: new Date().toISOString(), base, expectedOrigin: origin, recordOnly, failures, results }, null, 2))
console.log(`${routes.length} HTML pages + robots/sitemap; ${failures.length} issues; report: ${output}`)
if (!recordOnly && failures.length) process.exitCode = 1

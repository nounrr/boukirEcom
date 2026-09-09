import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSitemap, loadSitemapData } from '../src/lib/seo/sitemap-data.ts';
import { resolveSitemap } from 'next/dist/build/webpack/loaders/metadata/resolve-route-data.js';

const site = new URL('https://boukirdiamond.com');
const data = { products: Array.from({ length: 3737 }, (_, i) => ({ id: i + 1, updated_at: '2026-09-01T12:00:00.000Z' })), services: [{ id: 1, updated_at: null }], maalems: [{ id: 2, updated_at: '2026-08-20' }] };
const fetcher = (overrides = {}) => async url => {
  const key = url.includes('/products/') ? 'products' : url.includes('/services/') ? 'services' : 'maalems';
  if (overrides[key] instanceof Error) throw overrides[key];
  return new Response(JSON.stringify(overrides[key] ?? { [key]: data[key], ...(key === 'products' ? { total_items: data.products.length } : {}) }));
};
test('exports every eligible product in all four locales, stable real dates and unique URLs', async () => {
  const loaded = await loadSitemapData('https://api.example', fetcher());
  const entries = buildSitemap(loaded, site);
  assert.equal(entries.filter(x => x.url.includes('/product/')).length, 3737 * 4);
  assert.equal(entries.length, 3737 * 4 + 28);
  assert.equal(new Set(entries.map(x => x.url)).size, entries.length);
  for (const entry of entries) {
    assert.equal(new URL(entry.url).origin, site.origin);
    assert.match(new URL(entry.url).pathname, /^\/(fr|ar|en|zh)(\/|$)/);
    assert.equal(new URL(entry.url).search, '');
    assert.equal(Object.keys(entry.alternates.languages).length, 4);
  }
  assert.equal(entries[0].lastModified, undefined);
  assert.equal(entries.find(x => x.url.endsWith('/services/1')).lastModified, undefined);
  assert.equal(entries.find(x => x.url.endsWith('/product/1')).lastModified, '2026-09-01T12:00:00.000Z');
  assert.deepEqual(buildSitemap(loaded, site), entries);
  const xml = resolveSitemap(entries);
  assert.equal((xml.match(/<loc>/g) || []).length, entries.length);
  assert.ok(Buffer.byteLength(xml) < 50 * 1024 * 1024);
  assert.ok(!xml.includes('localhost'));
});
test('fail closed on unavailable API, missing lists, truncation, duplicates and empty product catalog', async () => {
  for (const overrides of [
    { products: new Error('timeout') }, { services: new Error('HTTP 503') }, { maalems: {} },
    { products: { products: data.products.slice(0, 20), total_items: 3737 } },
    { products: { products: [], total_items: 0 } },
    { products: { products: [data.products[0], data.products[0]], total_items: 2 } },
  ]) await assert.rejects(loadSitemapData('https://api.example', fetcher(overrides)));
  await assert.rejects(loadSitemapData('https://api.example', async () => new Response('', { status: 503 })), /HTTP 503/);
});
test('bad dates and protocol limit are rejected instead of silently dropping entries', () => {
  assert.throws(() => buildSitemap({ ...data, services: [{ id: 1, updated_at: 'invalid' }] }, site), /date/);
  assert.throws(() => buildSitemap({ ...data, products: Array.from({ length: 12500 }, (_, i) => ({ id: i + 1, updated_at: null })) }, site), /50,000/);
});

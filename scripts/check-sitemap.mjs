import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { buildSitemap, loadSitemapData } from '../src/lib/seo/sitemap-data.ts';
import { resolveSitemap } from 'next/dist/build/webpack/loaders/metadata/resolve-route-data.js';
const option = key => process.argv.find(x => x.startsWith(`--${key}=`))?.slice(key.length + 3);
const api = option('api') || 'https://boukirdiamond.com';
const site = new URL(option('origin') || 'https://boukirdiamond.com');
const output = option('output') || 'sitemap-check';
const fixture = process.argv.includes('--fixture');
const report = { checkedAt: new Date().toISOString(), fixture, api, origin: site.origin, checks: [], errors: [] };
try {
  const data = fixture ? {
    products: Array.from({ length: 3737 }, (_, i) => ({ id: i + 1, updated_at: '2026-09-01T12:00:00.000Z' })),
    services: [{ id: 1, updated_at: null }], maalems: [{ id: 1, updated_at: null }],
  } : await loadSitemapData(api);
  const entries = buildSitemap(data, site);
  const xml = resolveSitemap(entries);
  assert.equal(entries.length, new Set(entries.map(x => x.url)).size);
  assert.ok(entries.every(x => new URL(x.url).origin === site.origin));
  assert.ok(Buffer.byteLength(xml) <= 50 * 1024 * 1024);
  report.counts = { eligibleProducts: data.products.length, productUrls: entries.filter(x => x.url.includes('/product/')).length, services: data.services.length, maalems: data.maalems.length, urls: entries.length, bytes: Buffer.byteLength(xml) };
  assert.equal(report.counts.productUrls, report.counts.eligibleProducts * 4);
  await fs.writeFile(`${output}.xml`, xml);
  // Real API only: check first/middle/last product in both main languages.
  if (!fixture) {
    for (const row of [data.products[0], data.products[Math.floor(data.products.length / 2)], data.products.at(-1)]) {
      for (const locale of ['fr', 'ar']) {
        const url = `${site.origin}/${locale}/product/${row.id}`;
        const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
        const html = await response.text();
        const canonical = [...html.matchAll(/<link\b[^>]*>/g)].map(x => x[0]).find(x => /rel="canonical"/.test(x))?.match(/href="([^"]+)"/)?.[1];
        const ok = response.status === 200 && canonical === url && !/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/.test(html);
        report.checks.push({ url, status: response.status, canonical, ok });
        if (!ok) report.errors.push(`HTTP/canonical/indexability: ${url}`);
      }
    }
  }
} catch (error) { report.errors.push(error.message); }
await fs.writeFile(`${output}.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (report.errors.length) process.exitCode = 1;

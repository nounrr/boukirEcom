const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
require('../scripts/register-project.cjs');
process.env.NEXT_PUBLIC_SITE_URL = 'https://boukirdiamond.com';
const { createSnapshotStore } = require('../src/lib/seo/sitemap-snapshot.ts');
const { partitionSitemap, serializeSitemap } = require('../src/lib/seo/sitemap-publication.ts');
const { productHref, productIdFromSegment } = require('../src/lib/seo/product-url.ts');
const origin = 'https://boukirdiamond.com';

test('snapshot survives restart and API outage, expires and never replaces valid data with a partial failure', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'boukir-sitemap-'));
  let now = 1000000000, calls = 0, fail = false;
  const files = { 'index.xml': '<?xml version="1.0"?><sitemapindex/>', 'products-fr.xml': '<?xml version="1.0"?><urlset/>' };
  const generate = async () => { calls++; if (fail) throw Error('API down'); return files; };
  try {
    const store = createSnapshotStore(directory, origin, generate, () => now);
    const [a, b] = await Promise.all([store.get(), store.get()]);
    assert.deepEqual(a, b); assert.equal(calls, 1);
    await store.get(); assert.equal(calls, 1);
    now += 3600001; fail = true;
    const restarted = createSnapshotStore(directory, origin, generate, () => now);
    const fallback = await restarted.get();
    assert.equal(fallback.stale, true); assert.deepEqual(fallback.snapshot.files, files);
    const saved = JSON.parse(await fs.readFile(path.join(directory, (await fs.readdir(directory))[0]), 'utf8'));
    assert.equal(saved.generatedAt, a.snapshot.generatedAt);
    now += 7 * 86400000;
    await assert.rejects(restarted.get(), /API down/);
    await assert.rejects(createSnapshotStore(directory, 'https://other.example', generate).get(), /API down/);
  } finally { await fs.rm(directory, {recursive:true, force:true}); }
});

test('partitions preserve every URL and escape alternates; oversized parts and duplicate URLs fail', () => {
  const entries = Array.from({length:5001}, (_, i) => ({url:`${origin}/fr/product/${i+1}-ciment`, alternates:{languages:{fr:`${origin}/fr/product/${i+1}-ciment`}}}));
  const files = partitionSitemap(entries, origin);
  assert.ok(files['products-fr-1.xml']); assert.ok(files['products-fr-2.xml']);
  assert.equal((files['products-fr-1.xml'].match(/<loc>/g)||[]).length, 5000);
  assert.equal((files['products-fr-2.xml'].match(/<loc>/g)||[]).length, 1);
  assert.ok(files['index.xml'].includes('/sitemap-products-fr-2.xml'));
  assert.throws(() => partitionSitemap([entries[0],entries[0]],origin), /Duplicate/);
  assert.throws(() => serializeSitemap([{url:'https://other.example/fr'}],origin), /Invalid/);
  assert.throws(() => serializeSitemap([{url:origin+'/fr/shop?search=ciment'}],origin), /Invalid/);
});

test('product URLs use localized names, stable IDs and reject ambiguous segments', () => {
  const p = {id:6696,designation:'DANOSA 4 mm Vert / Bitume',designation_ar:'بيتومين أخضر',designation_zh:'绿色沥青'};
  assert.equal(productHref(p,'fr'),'/fr/product/6696-danosa-4-mm-vert-bitume');
  assert.equal(productHref(p,'ar'),'/ar/product/6696-بيتومين-اخضر');
  assert.equal(productHref(p,'zh'),'/zh/product/6696-绿色沥青');
  for (const value of ['6696','6696-old-name','6696-بيتومين']) assert.equal(productIdFromSegment(value),'6696');
  for (const value of ['0','abc','1/other','1-','1?x','9007199254740992-name']) assert.equal(productIdFromSegment(value),null);
});

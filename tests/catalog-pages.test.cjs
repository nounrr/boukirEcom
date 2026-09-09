const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
Module.registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('next/') && !path.extname(specifier) && fs.existsSync(path.join(root, 'node_modules', `${specifier}.js`))) return nextResolve(`${specifier}.js`, context);
  return nextResolve(specifier, context);
} });
// Test-only TS/alias loading: render the actual Server Component without an HTTP listener.
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(name, parent, ...rest) {
  if (name.startsWith('@/')) name = path.join(root, 'src', name.slice(2));
  return originalResolve.call(this, name, parent, ...rest);
};
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (mod, file) => {
  const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } });
  mod._compile(result.outputText, file);
};
process.env.NEXT_PUBLIC_SITE_URL = 'https://boukirdiamond.com';
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { catalogHref, catalogPage, categories, brands } = require('../src/lib/catalog/registry.ts');
const { catalogRoute, catalogMetadata } = require('../src/lib/catalog/route.tsx');
const { catalogPageNumber } = require('../src/lib/catalog/data.ts');
const { catalogSitemap } = require('../src/lib/catalog/sitemap.ts');
let total = 1;
let requests = [];
let unavailable = false;
global.fetch = async url => {
  requests.push(String(url));
  if (unavailable) return new Response('', { status: 503 });
  if (String(url).endsWith('/catalog-pages')) return Response.json({ categories: [{ id: 75, total }, { id: 73, total: 0 }], brands: [{ id: 37, total }] });
  if (String(url).endsWith('/categories')) return Response.json([{ id: 75 }, { id: 73 }]);
  if (String(url).endsWith('/brands')) return Response.json([{ id: 37 }]);
  return Response.json({ products: total ? [{ id: 6696, designation: 'Membrane bitume', designation_ar: 'غشاء بيتومين', prix_vente: 89.78, brand: { id: 37, nom: 'DANOSA' } }] : [], pagination: { total_items: total, total_pages: Math.ceil(total / 24), has_next: Number(new URL(url).searchParams.get('page') || 1) < Math.ceil(total / 24) } });
};
const props = (locale, slug, query = {}) => ({ params: Promise.resolve({ locale, slug }), searchParams: Promise.resolve(query) });
test('stable slugs, scoped links and strict page numbers', () => {
  assert.equal(catalogHref('fr', 'categories', 75), '/fr/categories/75-etancheite-bitume');
  assert.equal(catalogHref('ar', 'marques', 37), '/ar/marques/37-danosa');
  assert.equal(catalogHref('en', 'marques', 37), '/en/marques/37-danosa');
  assert.equal(catalogHref('zh', 'categories', 75), '/zh/categories/75-etancheite-bitume');
  assert.match(catalogHref('fr', 'categories', 999), /shop\?category_id=999/);
  assert.equal(catalogPage('categories', '75-fake-slug'), undefined);
  assert.equal(new Set(categories.map(x => x.slug)).size, categories.length);
  assert.equal(new Set(brands.map(x => x.slug)).size, brands.length);
  for (const value of ['0', '-1', '1.5', 'x', ['1'], '100001']) assert.equal(catalogPageNumber(value), null);
});
test('real server route emits product links and localized metadata before hydration, unknown slugs 404', async () => {
  for (const locale of ['fr', 'ar', 'en', 'zh']) {
    const input = props(locale, '75-etancheite-bitume');
    const html = renderToStaticMarkup(await catalogRoute('categories', input));
    assert.ok(html.includes(`href="/${locale}/product/6696"`));
    assert.ok(html.includes({ fr: 'Étanchéité', ar: 'العزل المائي', en: 'Waterproofing', zh: '防水材料' }[locale]));
    assert.equal((html.match(/<h1/g) || []).length, 1);
    assert.ok(html.includes('category_id=75'));
    const metadata = await catalogMetadata('categories', input);
    assert.equal(metadata.alternates.canonical, `https://boukirdiamond.com/${locale}/categories/75-etancheite-bitume`);
    assert.deepEqual(Object.keys(metadata.alternates.languages), ['fr', 'ar', 'en', 'zh']);
    assert.equal(metadata.robots.index, true);
    fs.writeFileSync(path.join(root, '../docs/seo-2026-09-08', `correction-04-ssr-${locale}.html`), '<!doctype html><meta charset="utf-8">' + html);
  }
  await assert.rejects(catalogRoute('categories', props('fr', '75-unknown')), e => e.digest?.includes('404'));
  await assert.rejects(catalogRoute('categories', props('fr', '75-etancheite-bitume', { page: '2' })), e => e.digest?.includes('404'));
  await assert.rejects(catalogRoute('categories', props('fr', '75-etancheite-bitume', { brand_id: '37' })), e => e.digest?.includes('/fr/shop?brand_id=37&category_id=75'));
  total = 49;
  const second = props('ar', '75-etancheite-bitume', { page: '2' });
  assert.equal((await catalogMetadata('categories', second)).alternates.canonical, 'https://boukirdiamond.com/ar/categories/75-etancheite-bitume?page=2');
  const html = renderToStaticMarkup(await catalogRoute('categories', second));
  assert.ok(html.includes('href="/ar/categories/75-etancheite-bitume"'));
  assert.ok(html.includes('href="/ar/categories/75-etancheite-bitume?page=3"'));
  assert.ok(requests.some(url => url.includes('page=2')));
  total = 1;
});
test('empty selections noindex, sitemap excludes empty pages, API errors are not 404', async () => {
  total = 0;
  assert.equal((await catalogMetadata('categories', props('fr', '75-etancheite-bitume'))).robots.index, false);
  assert.ok(renderToStaticMarkup(await catalogRoute('categories', props('ar', '75-etancheite-bitume'))).includes('لا توجد منتجات'));
  assert.deepEqual(await catalogSitemap(), []);
  total = 1;
  const entries = await catalogSitemap();
  assert.equal(entries.length, 8);
  assert.equal(new Set(entries.map(x => x.url)).size, 8);
  assert.ok(entries.some(x => x.url.endsWith('/marques/37-danosa')));
  unavailable = true;
  await assert.rejects(catalogRoute('categories', props('fr', '75-etancheite-bitume')), /indisponible/);
  await assert.rejects(catalogSitemap(), /HTTP 503/);
});

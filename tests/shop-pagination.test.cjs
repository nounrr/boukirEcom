const test = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { root } = require('../scripts/register-project.cjs')
process.env.NEXT_PUBLIC_SITE_URL = 'https://boukirdiamond.com'
process.env.NEXT_PUBLIC_API_URL = 'https://api.example'

const { normalizeShopParams, shopPageHref } = require('../src/lib/seo/shop-url.ts')
for (const name of ['product-card-row.tsx', 'product-card-tile.tsx']) {
  const modulePath = require.resolve(`../src/components/shop/${name}`)
  const exportName = name.includes('row') ? 'ProductCardRow' : 'ProductCardTile'
  require.cache[modulePath] = { id: modulePath, filename: modulePath, loaded: true, exports: { [exportName]: ({ product }) => React.createElement('a', { href: `/product/${product.id}` }, product.name) } }
}
const { ProductsList } = require('../src/components/shop/products-list.tsx')
const { NextIntlClientProvider } = require('next-intl')

const clientPath = require.resolve('../app/[locale]/(shop)/shop/shop-page-client.tsx')
require.cache[clientPath] = { id: clientPath, filename: clientPath, loaded: true, exports: function Client() { return null } }
const { default: ShopPage, generateMetadata } = require('../app/[locale]/(shop)/shop/page.tsx')

function props(query = {}, locale = 'fr') { return { params: Promise.resolve({ locale }), searchParams: Promise.resolve(query) } }
function response(page = 1, totalPages = 184) {
  return { products: [{ id: page, designation: `Produit page ${page}` }], pagination: { current_page: page, per_page: 20, total_items: 3676, total_pages: totalPages, has_previous: page > 1, has_next: page < totalPages, from: (page - 1) * 20 + 1, to: page * 20 }, filters: { categories: [], brands: [], colors: [], units: [], utility_types: [], price_range: { min: 0, max: 10000 } } }
}
global.fetch = async url => {
  const page = Number(new URL(url).searchParams.get('page') || 1)
  return Response.json(response(page))
}

test('simple pagination is indexable, self-canonical and keeps the page in all alternates', async () => {
  const metadata = await generateMetadata(props({ page: '2' }))
  assert.equal(metadata.robots.index, true)
  assert.equal(metadata.alternates.canonical, 'https://boukirdiamond.com/fr/shop?page=2')
  assert.equal(metadata.alternates.languages.ar, 'https://boukirdiamond.com/ar/shop?page=2')
  const element = await ShopPage(props({ page: '2' }))
  assert.equal(element.props.initialData.products[0].designation, 'Produit page 2')
  assert.equal(element.props.initialFilters.page, 2)
  assert.match(element.props.heading, /ciment|construction|matériaux/i)
  for (const locale of ['fr', 'ar', 'en', 'zh']) {
    const localized = await ShopPage(props({ page: '2' }, locale))
    assert.ok(localized.props.heading)
    assert.ok(localized.props.description)
  }
})

test('search, sort and filter combinations are noindex and canonicalize their real selection', async () => {
  for (const query of [{ search: 'ciment', page: '2' }, { sort: 'price_asc' }, { brand_id: '37', colors: 'rouge', page: '3' }]) {
    const normalized = normalizeShopParams(query).canonical.toString()
    const metadata = await generateMetadata(props(query))
    assert.equal(metadata.robots.index, false)
    assert.equal(metadata.alternates.canonical, `https://boukirdiamond.com/fr/shop?${normalized}`)
    if (query.search || query.colors) assert.equal(metadata.alternates.languages, undefined)
  }
})

test('page one and invalid URL values normalize; editorial categories redirect; out-of-range pages are 404', async () => {
  await assert.rejects(ShopPage(props({ page: '1', utm_source: 'google' })), error => error.digest?.includes('308') && error.digest.includes('/fr/shop?utm_source=google'))
  await assert.rejects(ShopPage(props({ page: '-5', unknown: 'x' })), error => error.digest?.includes('308') && error.digest.endsWith('/fr/shop;308;'))
  await assert.rejects(ShopPage(props({ category_id: '75', page: '2' })), error => error.digest?.includes('308') && error.digest.includes('/fr/categories/75-etancheite-bitume?page=2'))
  await assert.rejects(ShopPage(props({ page: '999' })), error => error.digest?.includes('404'))
})

test('pagination hrefs preserve filters and marketing, omit page one, and render as crawlable links', () => {
  const params = new URLSearchParams('search=ciment&utm_source=google&page=2')
  assert.equal(shopPageHref('/fr/shop', params, 1), '/fr/shop?search=ciment&utm_source=google')
  assert.equal(shopPageHref('/fr/shop', params, 3), '/fr/shop?search=ciment&utm_source=google&page=3')
  const messages = { productsList: { emptyTitle: 'Vide', emptyDescription: 'Vide', previous: 'Précédent', next: 'Suivant' } }
  const html = renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale: 'fr', messages }, React.createElement(ProductsList, {
    products: [{ id: 22, designation: 'Ciment page 2', prix_vente: 50, prix_promo: null, pourcentage_promo: 0, has_promo: false, image_url: '', quantite_disponible: 1, base_unit: 'sac', variants: { all: [] }, brand: { nom: 'Test' }, categorie: { id: 73, nom: 'Construction' } }], isLoading: false, isFetching: false, error: null, onRetry() {}, pagination: response(2, 4).pagination,
    onPageChange() {}, pageHref: page => shopPageHref('/fr/shop', params, page), onAddToCart() {}, onToggleWishlist() {}, onQuickView() {}, viewMode: 'grid', isFiltersCollapsed: false,
  })))
  assert.match(html, /href="\/fr\/shop\?search=ciment&amp;utm_source=google"/)
  assert.match(html, /href="\/fr\/shop\?search=ciment&amp;utm_source=google&amp;page=3"/)
  assert.match(html, /aria-current="page"/)
  assert.match(html, /Ciment page 2/)
})

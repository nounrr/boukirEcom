const test = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
require('../scripts/register-project.cjs')

function stub(request, exports) {
  const filename = require.resolve(request)
  require.cache[filename] = { id: filename, filename, loaded: true, exports }
}
const passthrough = ({ children }) => React.createElement('div', null, children)
stub('next-intl', { useLocale: () => 'fr' })
stub('next/link', ({ href, children }) => React.createElement('a', { href }, children))
stub('../src/components/ui/button.tsx', { Button: passthrough })
stub('../src/components/ui/carousel.tsx', {
  Carousel: passthrough, CarouselContent: passthrough, CarouselItem: passthrough,
  CarouselNext: () => null, CarouselPrevious: () => null,
})
stub('../src/components/shop/product-card-tile.tsx', {
  ProductCardTile: ({ product }) => React.createElement('a', { href: `/fr/product/${product.id}` }, product.name),
})
stub('../src/hooks/use-carousel-playback.ts', {
  useCarouselAutoplay() {}, useCarouselRuntimeState: () => ({ isScrollable: false, isLooping: false }),
})
stub('../src/state/api/products-api-slice.ts', {
  useGetFeaturedPromoQuery: () => ({ data: undefined, isLoading: true, isError: true }),
  useGetNewArrivalsQuery: () => ({ data: undefined, isLoading: true }),
})

const { HomeProductSections } = require('../src/components/home/home-product-sections.tsx')

test('home emits product content and crawlable links before client product requests resolve', () => {
  const product = { id: 7343, designation: 'Gazon Golf Pro', prix_vente: 375, prix_promo: null, pourcentage_promo: 0, has_promo: false, image_url: '/gazon.png', quantite_disponible: 20, base_unit: 'm2', variants: { all: [] }, categorie: { id: 79, nom: 'Jardinage' }, brand: { id: 4, nom: 'Test' } }
  const html = renderToStaticMarkup(React.createElement(HomeProductSections, {
    locale: 'fr', initialNewArrivals: [product], initialFeatured: [], featuredTitle: 'Promotions',
    newArrivalsTitle: 'Nouveautés', viewAllLabel: 'Voir tout', emptyLabel: 'Vide',
  }))
  assert.match(html, /Gazon Golf Pro/)
  assert.match(html, /href="\/fr\/product\/7343"/)
  assert.doesNotMatch(html, /animate-pulse/)
})

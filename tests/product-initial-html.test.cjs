const test = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
require('../scripts/register-project.cjs')

let locale = 'fr'
function stub(request, exports) {
  const filename = require.resolve(request)
  require.cache[filename] = { id: filename, filename, loaded: true, exports }
}
const element = (tag, extra = {}) => ({ children, ...props }) => React.createElement(tag, { ...extra, ...props }, children)

stub('next-intl', {
  useLocale: () => locale,
  useTranslations: () => (key) => ({
    currency: 'MAD', inStock: { fr: 'En stock', ar: 'متوفر', en: 'In stock', zh: '有货' }[locale],
    outOfStock: 'Out', categoryFallback: 'Category', descriptionHeading: 'Description',
    addToCart: 'Add', quantityLabel: 'Quantity', totalLabel: 'Total', unitLabel: 'Unit',
  }[key] ?? key),
})
stub('next/navigation', {
  useParams: () => ({ id: '7343-gazon-golf-pro' }),
  useSearchParams: () => new URLSearchParams(),
  notFound: () => { throw new Error('404') },
})
stub('next/link', element('a'))
stub('../src/components/layout/cart-context-provider.tsx', { useCart: () => ({ cartRef: { current: null } }) })
stub('../src/components/providers/auth-dialog-provider.tsx', { useAuthDialog: () => ({ openAuthDialog() {} }) })
stub('../src/components/shop/product-gallery.tsx', {
  ProductGallery: ({ images, altText }) => React.createElement('img', { src: images[0]?.image_url, alt: altText }),
})
stub('../src/components/shop/product-suggestions.tsx', { ProductSuggestions: () => null })
stub('../src/components/shop/variant-selector.tsx', { VariantSelector: () => null })
stub('../src/components/shop/technical-sheet.tsx', { TechnicalSheet: () => null })
stub('../src/components/ui/badge.tsx', { Badge: element('span') })
stub('../src/components/ui/button.tsx', { Button: element('button') })
stub('../src/components/ui/separator.tsx', { Separator: () => React.createElement('hr') })
stub('../src/hooks/use-toast.ts', { useToast: () => ({ success() {}, error() {} }) })
stub('../src/state/api/products-api-slice.ts', {
  useGetProductQuery: () => ({ data: undefined, isLoading: true, isError: false, refetch: async () => {} }),
})
stub('../src/state/api/wishlist-api-slice.ts', {
  useAddToWishlistMutation: () => [() => ({ unwrap: async () => {} }), { isLoading: false }],
  useRemoveFromWishlistByProductMutation: () => [() => ({ unwrap: async () => {} }), { isLoading: false }],
})
stub('../src/state/hooks.ts', { useAppSelector: () => ({ isAuthenticated: false }) })

const ProductPageClient = require('../app/[locale]/(shop)/product/[id]/product-page-client.tsx').default
const product = {
  id: 7343,
  designation: 'Gazon Golf Pro',
  designation_ar: 'عشب جولف احترافي',
  designation_en: 'Golf Pro Grass',
  designation_zh: '专业高尔夫草坪',
  description: 'Gazon de chantier',
  prix_vente: 375,
  prix_promo: null,
  pourcentage_promo: 0,
  has_promo: false,
  image_url: '/uploads/gazon.png',
  gallery: [{ id: 9, image_url: '/uploads/gazon.png', position: 0 }],
  quantite_disponible: 20,
  in_stock: true,
  base_unit: 'm2',
  variants: [],
  units: null,
  categorie: { id: 79, nom: 'Jardinage' },
  brand: { id: 4, nom: 'Test' },
  similar_products: [],
}

test('product commercial content is in initial HTML in all four locales before the browser query resolves', () => {
  const names = { fr: product.designation, ar: product.designation_ar, en: product.designation_en, zh: product.designation_zh }
  const units = { fr: 'm²', ar: 'م²', en: 'm²', zh: '平方米' }
  for (locale of ['fr', 'ar', 'en', 'zh']) {
    const html = renderToStaticMarkup(React.createElement(ProductPageClient, { initialProduct: product }))
    assert.match(html, new RegExp(`<h1[^>]*>${names[locale]} • ${units[locale]}</h1>`))
    assert.match(html, new RegExp(`375\\.00 MAD/${units[locale]}`))
    assert.match(html, new RegExp(`<img[^>]+alt="${names[locale]}"`))
    assert.doesNotMatch(html, /animate-pulse/)
  }
})

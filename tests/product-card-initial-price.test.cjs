const test = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
require('../scripts/register-project.cjs')

function stub(request, exports) {
  const filename = require.resolve(request)
  require.cache[filename] = { id: filename, filename, loaded: true, exports }
}
stub('next-intl', { useLocale: () => 'fr', useTranslations: () => key => key })
stub('next/link', ({ href, children }) => React.createElement('a', { href }, children))
stub('next/image', ({ src, alt }) => React.createElement('img', { src, alt }))
stub('../src/components/layout/cart-context-provider.tsx', { useCart: () => ({ cartRef: { current: null } }) })
stub('../src/components/providers/auth-dialog-provider.tsx', { useAuthDialog: () => ({ openAuthDialog() {} }) })
stub('../src/hooks/use-toast.ts', { useToast: () => ({ success() {}, error() {} }) })
stub('../src/state/hooks.ts', { useAppSelector: () => ({ isAuthenticated: false }) })
stub('../src/state/api/wishlist-api-slice.ts', {
  useAddToWishlistMutation: () => [() => {}, { isLoading: false }],
  useRemoveFromWishlistByProductMutation: () => [() => {}, { isLoading: false }],
})
stub('../src/components/shop/product-image-mask.tsx', { ProductImageMask: () => null })
stub('../src/components/shop/variant-swatches.tsx', {
  VariantSwatches: ({ selectedId }) => React.createElement('output', null, `selected:${selectedId}`),
})

const { ProductCard } = require('../src/components/shop/product-card.tsx')
const product = {
  id: 9914, name: 'Produit avec variante obligatoire', price: 999, image: '/test.webp',
  category: 'Test', stock: 20, isVariantRequired: true,
  variants: [{ id: 7, prix_vente: 85, variant_name: 'Premier' }, { id: 8, prix_vente: 60, variant_name: 'Deuxième' }],
}

test('grid and row cards render the first required variant price before effects run', () => {
  for (const layout of ['tile', 'row']) {
    for (const price of [0, 999]) {
      const html = renderToStaticMarkup(React.createElement(ProductCard, { product: { ...product, price }, layout }))
      assert.match(html, />85<\/span>/)
      assert.match(html, /selected:7/)
      assert.doesNotMatch(html, />(?:0|999)<\/span>/)
    }
  }
})

test('a mandatory variant with no price renders unavailable instead of the parent offer', () => {
  const html = renderToStaticMarkup(React.createElement(ProductCard, {
    product: { ...product, variants: [{ id: 7, prix_vente: 0 }] },
  }))
  assert.match(html, /priceUnavailable/)
  assert.doesNotMatch(html, />(?:0|999)<\/span>/)
})

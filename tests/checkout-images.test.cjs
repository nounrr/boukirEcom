const test = require('node:test')
const assert = require('node:assert/strict')
require('../scripts/register-project.cjs')
process.env.NEXT_PUBLIC_SITE_URL = 'https://boukirdiamond.com'
process.env.NEXT_PUBLIC_API_URL = 'https://api.example/api'
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { NextIntlClientProvider } = require('next-intl')
const promoPath = require.resolve('../src/components/shop/checkout/promo-code-input.tsx')
require.cache[promoPath] = { id: promoPath, filename: promoPath, loaded: true, exports: { PromoCodeInput: () => null } }
const { OrderCartSummary } = require('../src/components/shop/checkout/order-cart-summary.tsx')
const { ImageConfigContext } = require('next/dist/shared/lib/image-config-context.shared-runtime')
const { imageConfigDefault } = require('next/dist/shared/lib/image-config')
const config = require('../next.config.ts').default
const messages = require('../messages/fr.json')
function render(image) {
 return renderToStaticMarkup(React.createElement(ImageConfigContext.Provider, {value:{...imageConfigDefault,...config.images}}, React.createElement(NextIntlClientProvider, {locale:'fr', timeZone:'Africa/Casablanca', messages}, React.createElement(OrderCartSummary, {
  items:[{productId:1, name:'Produit', image, price:100, quantity:1}], subtotal:100, shippingCost:0, total:100
 }))))
}
test('checkout product thumbnails resolve backend upload paths before Next image rendering', () => {
 for (const path of ['/uploads/products/item.webp', 'uploads/products/item.webp']) {
  const html=render(path)
  assert.match(html, /https%3A%2F%2Fapi.example%2Fuploads%2Fproducts%2Fitem.webp/)
  assert.match(html, /sizes="64px"/)
 }
})
test('checkout renders empty images and public editorial fallbacks without invalid backend URLs', () => {
 assert.doesNotMatch(render('null'), /alt="Produit"/)
 const html=render('/product-fallbacks/metal.webp')
 assert.match(html, /%2Fproduct-fallbacks%2Fmetal.webp/)
 assert.doesNotMatch(html, /api.example/)
})

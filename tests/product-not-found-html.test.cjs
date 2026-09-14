const test = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
require('../scripts/register-project.cjs')

let locale = 'fr'
const titles = { fr: 'Produit introuvable', ar: 'المنتج غير موجود', en: 'Product not found', zh: '未找到商品' }
const intlPath = require.resolve('next-intl/server')
require.cache[intlPath] = {
  id: intlPath, filename: intlPath, loaded: true,
  exports: {
    getLocale: async () => locale,
    getTranslations: async () => key => ({
      'product.title': titles[locale],
      'product.description': 'Description',
      'product.primaryLabel': 'Shop',
      'default.primaryLabel': 'Home',
    })[key],
  },
}

const ProductNotFound = require('../app/[locale]/(shop)/product/[id]/not-found.tsx').default

test('product 404 HTML is server rendered, translated and links back to useful catalogue pages', async () => {
  for (locale of ['fr', 'ar', 'en', 'zh']) {
    const html = renderToStaticMarkup(await ProductNotFound())
    assert.match(html, new RegExp(`<h1[^>]*>${titles[locale]}</h1>`))
    assert.match(html, new RegExp(`href="/${locale}/shop"`))
    assert.match(html, new RegExp(`href="/${locale}/categories/73-matieres-de-construction"`))
    assert.match(html, new RegExp(`href="/${locale}/categories/75-etancheite-bitume"`))
    assert.doesNotMatch(html, /application\/ld\+json/)
  }
})

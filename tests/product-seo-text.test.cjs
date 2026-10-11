const test = require('node:test')
const assert = require('node:assert/strict')
require('../scripts/register-project.cjs')
const { buildProductSeoText } = require('../src/lib/seo/product.ts')
const product = { id: 1003, designation: 'RAIN STOP 1 L', description: 'FACE', prix_vente: 220, brand: { id: 1, nom: 'INGCO' }, categorie: { nom: 'Nettoyage' } }

test('product SEO identifies product, brand and city, and expands sparse descriptions', () => {
  const seo = buildProductSeoText({ product, locale: 'fr' })
  assert.equal(seo.metaTitle, 'RAIN STOP 1 L INGCO — Tanger')
  assert.match(seo.metaDescription, /RAIN STOP 1 L INGCO à Tanger/)
  assert.notEqual(seo.metaDescription, 'FACE')
  assert.ok(seo.metaDescription.length <= 160)
  assert.equal(seo.price, 220)
  assert.equal(buildProductSeoText({ product: { ...product, designation: 'INGCO Perceuse' }, locale: 'fr' }).metaTitle, 'INGCO Perceuse — Tanger')
})

test('substantial authored descriptions are retained', () => {
  const description = 'Comparez les caractéristiques de ce produit et consultez sa fiche technique avant de choisir le conditionnement adapté.'
  assert.equal(buildProductSeoText({ product: { ...product, description }, locale: 'fr' }).metaDescription, description)
})

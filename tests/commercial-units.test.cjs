const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
require('../scripts/register-project.cjs');

const { formatCommercialUnit, formatUnitRate, commercialLineTotal } = require('../src/lib/commercial-unit.ts');

test('commercial units distinguish length, surface, volume and packaging in FR/AR', () => {
  assert.equal(formatUnitRate('MAD', 'm', 'fr'), 'MAD/m');
  assert.equal(formatUnitRate('درهم', 'm', 'ar'), 'درهم/م');
  assert.equal(formatCommercialUnit('m2', 'fr'), 'm²');
  assert.equal(formatCommercialUnit('m2', 'ar'), 'م²');
  assert.equal(formatCommercialUnit('rouleau', 'fr'), 'rouleau');
  assert.equal(formatCommercialUnit('rouleau', 'ar'), 'لفة');
  assert.equal(formatCommercialUnit('sac', 'ar'), 'كيس');
  assert.equal(formatCommercialUnit('camion', 'fr'), 'camion');
  assert.equal(formatCommercialUnit('fiaj', 'ar'), 'فياج');
});

test('unknown units remain unchanged and no conversion is invented', () => {
  assert.equal(formatCommercialUnit('palette 42 sacs', 'fr'), 'palette 42 sacs');
  assert.equal(formatCommercialUnit('', 'fr'), 'unité');
  assert.equal(commercialLineTotal(89.78, 3), 269.34);
  assert.equal(commercialLineTotal(12.345, 2), 24.69);
});

test('cart and order SQL snapshot the base unit when no alternative unit is selected', () => {
  const cart = fs.readFileSync('../backend/routes/ecommerce/cart.js', 'utf8');
  const orders = fs.readFileSync('../backend/routes/ecommerce/orders.js', 'utf8');
  const fallback = /COALESCE\(NULLIF\(pu\.unit_name, ''\), NULLIF\(p\.base_unit, ''\), 'unité'\) AS unit_name/g;
  assert.equal((cart.match(fallback) || []).length, 2);
  assert.equal((orders.match(fallback) || []).length, 8);
  assert.match(orders, /insertColumns[\s\S]*'unit_name'/);
  assert.match(orders, /insertValues[\s\S]*item\.unit_name/);
});

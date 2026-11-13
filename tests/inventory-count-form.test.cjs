const test = require('node:test');
const assert = require('node:assert/strict');
require('../scripts/register-project.cjs');
const { normalizeCountName, normalizeCountQuantity, countIntentFor } = require('../src/lib/inventory-count-form.ts');

test('counter names are normalized and must identify the participant', () => {
  assert.equal(normalizeCountName('  Amine   El Boukir  '), 'Amine El Boukir');
  assert.equal(normalizeCountName(' Ａmine '), 'Amine');
  for (const name of ['', ' ', 'A', 'A'.repeat(101), 'A\u0000B']) {
    assert.throws(() => normalizeCountName(name), /nom complet/);
  }
  assert.equal(normalizeCountName('A'.repeat(100)).length, 100);
});

test('quantities accept zero and French decimal input up to the supported limit', () => {
  for (const [value, normalized] of [['0', '0'], [' 2,5 ', '2.5'], ['0.001', '0.001'], ['999999999.999', '999999999.999']]) {
    assert.equal(normalizeCountQuantity(value), normalized);
  }
  for (const value of ['', ' ', '-1', '+1', 'NaN', 'Infinity', '1e3', '1.0001', '1,2,3', '1.2.3', '1000000000', '999999999.9999']) {
    assert.throws(() => normalizeCountQuantity(value), /quantité/);
  }
});

const count = { name: 'Amine', product_id: 12, variant_id: null, quantity: '2.5' };

test('an uncertain retry reuses its request key for the same payload', () => {
  let generated = 0;
  const generate = () => `request-${++generated}`;
  const first = countIntentFor(null, count, generate);
  const retry = countIntentFor(first, { ...count }, generate);
  assert.equal(retry.requestKey, first.requestKey);
  assert.equal(retry, first);
  assert.equal(generated, 1);
});

test('changing any saved field creates a separate intent', () => {
  const first = countIntentFor(null, count, () => 'original');
  for (const changed of [{ name: 'Sara' }, { product_id: 13 }, { variant_id: 9 }, { quantity: '3' }]) {
    assert.equal(countIntentFor(first, { ...count, ...changed }, () => 'new-request').requestKey, 'new-request');
  }
});

test('another deliberate count of the same item after success has a fresh key', () => {
  const first = countIntentFor(null, count, () => 'first');
  // The UI clears the completed intent after confirmed success.
  const second = countIntentFor(null, count, () => 'second');
  assert.notEqual(first.requestKey, second.requestKey);
});

test('public counting links are excluded from shop prompts in every locale', () => {
  const { GOOGLE_ONE_TAP_CONFIG } = require('../src/lib/google-one-tap-config.ts');
  const { ARTISAN_REQUEST_PROMPT_CONFIG } = require('../src/lib/artisan-request-prompt-config.ts');
  for (const locale of ['fr', 'en', 'ar', 'zh']) {
    const pathname = `/${locale}/comptage/example-private-token`;
    for (const config of [GOOGLE_ONE_TAP_CONFIG, ARTISAN_REQUEST_PROMPT_CONFIG]) {
      assert.equal(config.EXCLUDED_PATHS.some(path => pathname.includes(path)), true);
    }
  }
});

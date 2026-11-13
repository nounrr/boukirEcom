const test = require('node:test')
const assert = require('node:assert/strict')
require('../scripts/register-project.cjs')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { NextIntlClientProvider } = require('next-intl')
const { PaymentStep } = require('../src/components/shop/checkout/payment-step.tsx')
const messages = require('../messages/fr.json')

function render(overrides = {}) {
  return renderToStaticMarkup(React.createElement(NextIntlClientProvider, {
    locale: 'fr', timeZone: 'Africa/Casablanca', messages,
  }, React.createElement(PaymentStep, {
    register: name => ({ name }), errors: {}, watch: () => undefined,
    orderTotal: 100, isAuthenticated: true, isSoldeEligible: true,
    ...overrides,
  })))
}

test('credit payment is offered only to authenticated authorized customers', () => {
  assert.match(render(), /value="solde"/)
  assert.match(render(), /Payer à crédit/)
  assert.doesNotMatch(render({ isAuthenticated: false }), /value="solde"/)
  assert.doesNotMatch(render({ isSoldeEligible: false }), /value="solde"/)
})

test('credit payment respects available credit for delivery and pickup', () => {
  assert.doesNotMatch(render({ soldeAvailable: 99 }), /value="solde"/)
  for (const deliveryMethod of ['delivery', 'pickup']) {
    assert.match(render({ soldeAvailable: 100, deliveryMethod }), /value="solde"/)
  }
})

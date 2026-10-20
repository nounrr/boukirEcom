import type { CmiPaymentForm } from '@/types/order'

/**
 * Redirects the browser to the Chaabi Payment (CMI) secure page by POSTing the signed form.
 * The card is entered on the CMI page only: no card data ever goes through our site.
 * The form must contain exactly the signed fields (no named submit button), otherwise the
 * CMI hash check fails with "3D-1004 Code de sécurité erroné".
 */
export function redirectToCmiPayment(payment: CmiPaymentForm | null | undefined): boolean {
  if (!payment?.url || !payment.fields || typeof document === 'undefined') return false

  const form = document.createElement('form')
  form.method = 'POST'
  form.action = payment.url
  form.acceptCharset = 'UTF-8'
  form.style.display = 'none'

  for (const [name, value] of Object.entries(payment.fields)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }

  document.body.appendChild(form)
  form.submit()
  return true
}

export function cmiPaymentResultPath(locale: string, params: { status: string; order?: string | null; token?: string | null }) {
  const query = new URLSearchParams({ status: params.status })
  if (params.order) query.set('order', params.order)
  if (params.token) query.set('token', params.token)
  return `/${locale}/checkout/payment-result?${query.toString()}`
}

import { API_CONFIG } from '@/lib/api-config'
import type { CmiPaymentForm } from '@/types/order'

/** How a service request is paid: the amount the shop set, then card (online) or transfer / cheque / cash. */
export type ServicePaymentMethod = 'cmi' | 'virement' | 'cheque' | 'especes'
export const SERVICE_PAYMENT_METHODS: ServicePaymentMethod[] = ['cmi', 'virement', 'cheque', 'especes']

export interface ServiceBilling {
  amount: number
  method: ServicePaymentMethod | null
  status: 'unpaid' | 'declared' | 'paid'
  reference: string | null
  declared_at: string | null
  paid_at: string | null
}

export interface ServicePaymentAttempt {
  oid: string
  service_request_id: number
  amount: number
  status: 'initiated' | 'approved' | 'declined' | 'error'
  paid: boolean
}

export class ServicePaymentError extends Error {
  constructor(message: string, public readonly status: number, public readonly errorType?: string) {
    super(message)
  }
}

async function call<T>(path: string, accessToken: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`${API_CONFIG.BASE_URL}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Platform: 'web',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  })
  const payload = (await response.json().catch(() => ({}))) as T & { message?: string; error_type?: string }
  if (!response.ok) throw new ServicePaymentError(payload.message || 'Erreur', response.status, payload.error_type)
  return payload
}

/** null until the shop has set the amount and confirmed the request (an older server answers 404: no card). */
export async function getServicePayment(requestId: number, accessToken: string): Promise<ServiceBilling | null> {
  try {
    const result = await call<{ billing: ServiceBilling | null }>(`/api/service-requests/${requestId}/payment`, accessToken)
    return result.billing
  } catch (error) {
    if (error instanceof ServicePaymentError && error.status === 404) return null
    throw error
  }
}

/** The client pays by transfer, cheque or cash: the shop then records the reception. */
export async function chooseServicePaymentMethod(requestId: number, method: Exclude<ServicePaymentMethod, 'cmi'>, accessToken: string) {
  const result = await call<{ billing: ServiceBilling }>(`/api/service-requests/${requestId}/payment/method`, accessToken, { method: 'POST', body: { method } })
  return result.billing
}

/** A signed CMI form for the request's amount (the server uses the amount the shop set). */
export async function startServiceCardPayment(requestId: number, locale: string, accessToken: string) {
  return call<{ cmi_payment: CmiPaymentForm; oid: string; amount: number }>(`${API_CONFIG.ENDPOINTS.CMI_PAYMENTS}/service`, accessToken, {
    method: 'POST',
    body: { request_id: requestId, locale },
  })
}

/** What the bank answered for a service card payment (the browser return itself proves nothing). */
export async function getServicePaymentAttempt(oid: string, accessToken: string) {
  return call<ServicePaymentAttempt>(`${API_CONFIG.ENDPOINTS.CMI_PAYMENTS}/service/${encodeURIComponent(oid)}`, accessToken)
}

/** The request behind a card payment reference ("SRVPAY-51-xyz" -> 51). */
export function requestIdFromOid(oid: string | null | undefined): number | null {
  const match = /^SRVPAY-(\d+)-/.exec(String(oid ?? ''))
  return match ? Number(match[1]) : null
}

export function billingStage(billing: ServiceBilling | null | undefined): 'none' | 'to_pay' | 'awaiting_shop' | 'paid' {
  if (!billing) return 'none'
  if (billing.status === 'paid') return 'paid'
  if (billing.status === 'declared') return 'awaiting_shop'
  return 'to_pay'
}

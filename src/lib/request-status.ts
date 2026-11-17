/**
 * How the customer reads each request status in "Mes demandes" — the same labels and colours as the mobile app
 * (app: src/lib/request-status.ts). The label is a key of `serviceRequests.tracking.state`.
 */
export type RequestStateKey =
  | 'new' | 'qualified' | 'waitingCustomer' | 'confirmed' | 'assigned' | 'scheduled' | 'onTheWay' | 'onSite'
  | 'working' | 'inProgress' | 'toValidate' | 'closed' | 'cancelled' | 'rejected'

export interface RequestState {
  key: RequestStateKey
  /** Card edge and pill colour. */
  color: string
}

const STATES: Record<string, RequestState> = {
  new: { key: 'new', color: '#C77700' },
  to_contact: { key: 'qualified', color: '#0A84FF' },
  processing: { key: 'qualified', color: '#0A84FF' },
  qualified: { key: 'qualified', color: '#0A84FF' },
  waiting_customer: { key: 'waitingCustomer', color: '#C77700' },
  confirmed: { key: 'confirmed', color: '#0A84FF' },
  assigned: { key: 'assigned', color: '#5E5CE6' },
  scheduled: { key: 'scheduled', color: '#5E5CE6' },
  to_do: { key: 'scheduled', color: '#5E5CE6' },
  en_route: { key: 'onTheWay', color: '#0A84FF' },
  arrived: { key: 'onSite', color: '#0A84FF' },
  work_in_progress: { key: 'working', color: '#BF8F1F' },
  in_progress: { key: 'inProgress', color: '#0A84FF' },
  completed: { key: 'toValidate', color: '#1F9D55' },
  closed: { key: 'closed', color: '#1F9D55' },
  cancelled: { key: 'cancelled', color: '#D93F3F' },
  rejected: { key: 'rejected', color: '#D93F3F' },
}

/** The customer-facing state of a server status; `null` for a status the site does not know yet. */
export function requestState(status: string): RequestState | null {
  return STATES[status] ?? null
}

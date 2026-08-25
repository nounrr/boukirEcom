import { API_CONFIG } from '@/lib/api-config'
import type {
  CreateServiceRequestResponse,
  CompatibleServiceMaalemsResponse,
  OperationalNotification,
  PublicMaalemDetail,
  PublicMaalemSummary,
  PublicMaalemsResponse,
  PublicMaalemReviewsResponse,
  PublicService,
  PublicServicesResponse,
  MaalemReview,
  MaalemReviewContext,
  ReviewInvitationResolution,
  ServiceRequest,
  ServiceRequestDetails,
} from '@/types/service-request'

export interface QuickRequestInput {
  problemDescription: string
  contactName?: string
  contactPhone: string
  city: string
  address?: string
  latitude?: number | null
  longitude?: number | null
  desiredDate?: string
  desiredTimeSlot?: string
  additionalInformation?: string
  photos: File[]
  clientSubmissionId: string
}

export interface SelectedServiceRequestInput extends QuickRequestInput {
  serviceId: number
}

export interface SelectedMaalemRequestInput {
  requestedMaalemId: number
  serviceId?: number
  problemDescription: string
  contactPhone: string
  city: string
  address: string
  latitude?: number | null
  longitude?: number | null
  desiredDate?: string
  desiredTimeSlot?: string
  sharedNote?: string
  photos: File[]
  clientSubmissionId: string
}

export class ServiceRequestApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fields: Record<string, string> = {},
    public readonly errorType?: string,
  ) {
    super(message)
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({})) as {
    message?: string
    errors?: Record<string, string>
    error_type?: string
  }
  if (!response.ok) {
    throw new ServiceRequestApiError(
      payload.message || 'Impossible d’envoyer la demande pour le moment.',
      response.status,
      payload.errors,
      payload.error_type,
    )
  }
  return payload as T
}

function buildCommonRequestBody(input: QuickRequestInput) {
  const body = new FormData()
  body.set('problem_description', input.problemDescription.trim())
  body.set('contact_phone', input.contactPhone.trim())
  body.set('city', input.city.trim())
  body.set('client_submission_id', input.clientSubmissionId)

  if (input.contactName?.trim()) body.set('contact_name', input.contactName.trim())
  if (input.address?.trim()) body.set('address', input.address.trim())
  if (input.latitude != null && input.longitude != null) {
    body.set('latitude', String(input.latitude))
    body.set('longitude', String(input.longitude))
  }
  if (input.desiredDate) body.set('desired_date', input.desiredDate)
  if (input.desiredTimeSlot?.trim()) body.set('desired_time_slot', input.desiredTimeSlot.trim())
  if (input.additionalInformation?.trim()) body.set('shared_note', input.additionalInformation.trim())
  input.photos.forEach((photo) => body.append('attachments', photo, photo.name))
  return body
}

async function postServiceRequest(
  endpoint: 'quick' | 'selected-service',
  body: FormData,
  accessToken: string,
) {
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/service-requests/${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Platform: 'web',
    },
    body,
  })
  return parseResponse<CreateServiceRequestResponse>(response)
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function toPublicMaalemSummary(value: unknown): PublicMaalemSummary | null {
  if (!value || typeof value !== 'object') return null
  const source = value as Record<string, unknown>
  const categorySource = source.category
  if (!Number.isSafeInteger(source.id) || Number(source.id) <= 0) return null
  if (typeof source.public_name !== 'string' || !source.public_name.trim()) return null
  if (source.is_verified !== true) return null
  if (!categorySource || typeof categorySource !== 'object') return null

  const category = categorySource as Record<string, unknown>
  if (!Number.isSafeInteger(category.id) || Number(category.id) <= 0) return null

  const experience = source.experience_years
  return {
    id: Number(source.id),
    public_name: source.public_name.trim(),
    photo_url: nullableString(source.photo_url),
    is_verified: true,
    category: {
      id: Number(category.id),
      name: nullableString(category.name),
      name_ar: nullableString(category.name_ar),
    },
    city: nullableString(source.city),
    intervention_areas: stringList(source.intervention_areas),
    skills: stringList(source.skills),
    experience_years:
      typeof experience === 'number' && Number.isFinite(experience) && experience >= 0
        ? experience
        : null,
    professional_summary: nullableString(source.professional_summary),
  }
}

export function resolvePublicMaalemPhoto(photoUrl: string | null): string | null {
  if (!photoUrl) return null
  try {
    const url = new URL(photoUrl, `${API_CONFIG.BASE_URL}/`)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

export async function getPublicMaalem(id: number): Promise<PublicMaalemDetail | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/maalems/${id}`, {
      cache: 'no-store',
      headers: { Platform: 'web' },
    })
    if (!response.ok) return null
    const payload = await response.json().catch(() => null) as { maalem?: unknown } | null
    const summary = toPublicMaalemSummary(payload?.maalem)
    if (!summary || !payload?.maalem || typeof payload.maalem !== 'object') return null
    const source = payload.maalem as Record<string, unknown>
    const statistics = source.statistics && typeof source.statistics === 'object' ? source.statistics as Record<string, unknown> : {}
    const breakdown = (value: unknown) => Array.isArray(value) ? value.flatMap((item) => {
      if (!item || typeof item !== 'object') return []
      const row = item as Record<string, unknown>
      return Number.isSafeInteger(row.id) && Number.isFinite(Number(row.closed_interventions))
        ? [{ id: Number(row.id), name: nullableString(row.name), closed_interventions: Math.max(0, Number(row.closed_interventions)) }]
        : []
    }) : []
    const compatibleServices: PublicService[] = Array.isArray(source.compatible_services) ? source.compatible_services.flatMap((item) => {
      if (!item || typeof item !== 'object') return []
      const row = item as Record<string, unknown>
      if (!Number.isSafeInteger(row.id) || !nullableString(row.nom)) return []
      const categories = Array.isArray(row.categories) ? row.categories.flatMap((entry) => {
        if (!entry || typeof entry !== 'object') return []
        const category = entry as Record<string, unknown>
        return Number.isSafeInteger(category.id) && nullableString(category.nom) ? [{ id: Number(category.id), nom: nullableString(category.nom)!, nom_ar: nullableString(category.nom_ar) || '' }] : []
      }) : []
      return [{ id: Number(row.id), nom: nullableString(row.nom)!, nom_ar: nullableString(row.nom_ar) || '', description: nullableString(row.description), description_ar: nullableString(row.description_ar), image_url: nullableString(row.image_url), categories }]
    }) : []
    const distributionSource = statistics.rating_distribution && typeof statistics.rating_distribution === 'object'
      ? statistics.rating_distribution as Record<string, unknown>
      : {}
    const reviewCount = Math.max(0, Number(statistics.review_count) || 0)
    const averageRating = reviewCount > 0 && Number.isFinite(Number(statistics.average_rating))
      ? Math.min(5, Math.max(1, Number(statistics.average_rating)))
      : null
    return { ...summary, statistics: { closed_interventions: Math.max(0, Number(statistics.closed_interventions) || 0), last_closed_intervention_at: nullableString(statistics.last_closed_intervention_at), by_service: breakdown(statistics.by_service), by_category: breakdown(statistics.by_category), average_rating: averageRating, review_count: reviewCount, rating_distribution: { 1: Math.max(0, Number(distributionSource['1']) || 0), 2: Math.max(0, Number(distributionSource['2']) || 0), 3: Math.max(0, Number(distributionSource['3']) || 0), 4: Math.max(0, Number(distributionSource['4']) || 0), 5: Math.max(0, Number(distributionSource['5']) || 0) } }, compatible_services: compatibleServices }
  } catch {
    return null
  }
}

export async function getPublicMaalemSitemapEntries(): Promise<Array<{ id: number; updated_at: string | null }>> {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/maalems/sitemap`, { cache: 'no-store', headers: { Platform: 'web' } })
    const payload = await parseResponse<{ maalems?: Array<{ id: number; updated_at: string | null }> }>(response)
    return Array.isArray(payload.maalems) ? payload.maalems : []
  } catch { return [] }
}

export async function getPublicMaalems(filters: Record<string, string | number | undefined>): Promise<PublicMaalemsResponse> {
  const params = new URLSearchParams(); for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== '') params.set(key, String(value))
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/maalems?${params}`, { cache: 'no-store', headers: { Platform: 'web' } })
  return parseResponse<PublicMaalemsResponse>(response)
}

export async function getPublicMaalemReviews(id: number, page = 1, perPage = 6): Promise<PublicMaalemReviewsResponse | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null
  try {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/maalems/${id}/reviews?${params}`, {
      cache: 'no-store', headers: { Platform: 'web' },
    })
    if (!response.ok) return null
    return parseResponse<PublicMaalemReviewsResponse>(response)
  } catch { return null }
}

export async function createSelectedMaalemServiceRequest(
  input: SelectedMaalemRequestInput,
  accessToken: string,
): Promise<CreateServiceRequestResponse> {
  const body = new FormData()
  body.set('requested_maalem_id', String(input.requestedMaalemId))
  body.set('problem_description', input.problemDescription.trim())
  body.set('contact_phone', input.contactPhone.trim())
  body.set('city', input.city.trim())
  body.set('address', input.address.trim())
  body.set('client_submission_id', input.clientSubmissionId)

  if (input.serviceId != null) body.set('service_id', String(input.serviceId))
  if (input.latitude != null && input.longitude != null) {
    body.set('latitude', String(input.latitude))
    body.set('longitude', String(input.longitude))
  }
  if (input.desiredDate) body.set('desired_date', input.desiredDate)
  if (input.desiredTimeSlot?.trim()) body.set('desired_time_slot', input.desiredTimeSlot.trim())
  if (input.sharedNote?.trim()) body.set('shared_note', input.sharedNote.trim())
  input.photos.forEach((photo) => body.append('attachments', photo, photo.name))

  const response = await fetch(`${API_CONFIG.BASE_URL}/api/service-requests/selected-maalem`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Platform: 'web',
    },
    body,
  })
  return parseResponse<CreateServiceRequestResponse>(response)
}

export async function createQuickServiceRequest(
  input: QuickRequestInput,
  accessToken: string,
): Promise<CreateServiceRequestResponse> {
  return postServiceRequest('quick', buildCommonRequestBody(input), accessToken)
}

export async function createSelectedServiceRequest(
  input: SelectedServiceRequestInput,
  accessToken: string,
): Promise<CreateServiceRequestResponse> {
  const body = buildCommonRequestBody(input)
  body.set('service_id', String(input.serviceId))
  return postServiceRequest('selected-service', body, accessToken)
}

export async function getActiveService(serviceId: number): Promise<PublicService> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/services/${serviceId}`, {
    cache: 'no-store',
    headers: { Platform: 'web' },
  })
  return parseResponse<PublicService>(response)
}

export async function getActiveServices(filters: {
  q?: string
  categoryId?: number
  page?: number
  perPage?: number
} = {}): Promise<PublicServicesResponse> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.categoryId) params.set('category_id', String(filters.categoryId))
  if (filters.page) params.set('page', String(filters.page))
  if (filters.perPage) params.set('per_page', String(filters.perPage))
  const query = params.toString()
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/services${query ? `?${query}` : ''}`, {
    cache: 'no-store',
    headers: { Platform: 'web' },
  })
  return parseResponse<PublicServicesResponse>(response)
}

export async function getCompatibleServiceMaalems(
  serviceId: number,
  page = 1,
  perPage = 6,
): Promise<CompatibleServiceMaalemsResponse> {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/services/${serviceId}/maalems?${params}`, {
    cache: 'no-store',
    headers: { Platform: 'web' },
  })
  return parseResponse<CompatibleServiceMaalemsResponse>(response)
}

export async function getPublicServiceSitemapEntries(): Promise<Array<{ id: number; updated_at: string | null }>> {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/services/sitemap`, { cache: 'no-store', headers: { Platform: 'web' } })
    const payload = await parseResponse<{ services?: Array<{ id: number; updated_at: string | null }> }>(response)
    return Array.isArray(payload.services) ? payload.services : []
  } catch { return [] }
}

export async function getServiceRequestDetails(
  requestId: number,
  accessToken: string,
): Promise<ServiceRequestDetails> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/service-requests/${requestId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Platform: 'web',
    },
    cache: 'no-store',
  })
  return parseResponse<ServiceRequestDetails>(response)
}

export async function getServiceRequestReviewContext(
  requestId: number,
  accessToken: string,
): Promise<MaalemReviewContext> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/service-requests/${requestId}/review`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Platform: 'web',
    },
    cache: 'no-store',
  })
  return parseResponse<MaalemReviewContext>(response)
}

export async function createServiceRequestReview(
  requestId: number,
  input: { rating: number; comment: string | null },
  accessToken: string,
): Promise<MaalemReview> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/service-requests/${requestId}/review`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Platform: 'web',
    },
    body: JSON.stringify(input),
  })
  const payload = await parseResponse<{ review: MaalemReview }>(response)
  return payload.review
}

export async function resolveReviewInvitation(
  token: string,
  accessToken: string,
): Promise<ReviewInvitationResolution> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/review-invitations/${encodeURIComponent(token)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Platform: 'web',
    },
    cache: 'no-store',
  })
  return parseResponse<ReviewInvitationResolution>(response)
}

export async function getMyServiceRequests(accessToken: string): Promise<ServiceRequest[]> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/service-requests`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Platform: 'web',
    },
    cache: 'no-store',
  })
  const payload = await parseResponse<{ requests?: ServiceRequest[] }>(response)
  return Array.isArray(payload.requests) ? payload.requests : []
}

export async function getMyServiceRequestNotifications(accessToken: string): Promise<OperationalNotification[]> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/service-requests/notifications`, {
    headers: { Authorization: `Bearer ${accessToken}`, Platform: 'web' },
    cache: 'no-store',
  })
  const payload = await parseResponse<{ notifications?: OperationalNotification[] }>(response)
  return Array.isArray(payload.notifications) ? payload.notifications : []
}

export async function markServiceRequestNotificationRead(notificationId: number, accessToken: string): Promise<void> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/service-requests/notifications/${notificationId}/read`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, Platform: 'web' },
  })
  await parseResponse<unknown>(response)
}

export async function downloadServiceRequestAttachment(
  requestId: number,
  attachmentId: number,
  filename: string,
  accessToken: string,
): Promise<void> {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/api/service-requests/${requestId}/attachments/${attachmentId}/download`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Platform: 'web',
      },
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    await parseResponse<never>(response)
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename || `attachment-${attachmentId}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

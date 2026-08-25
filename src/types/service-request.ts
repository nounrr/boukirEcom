export interface ServiceRequest {
  id: number
  request_number: string
  requester_contact_id: number
  request_source: 'selected_maalem' | 'selected_service' | 'quick_request'
  service_id: number | null
  requested_maalem_id: number | null
  category_id: number | null
  title?: string | null
  problem_description: string | null
  requester_name?: string | null
  requester_phone?: string | null
  requester_email?: string | null
  city: string | null
  intervention_address?: string | null
  latitude?: number | null
  longitude?: number | null
  desired_date?: string | null
  desired_time_slot?: string | null
  status: string
  request_channel?: string | null
  service_name?: string | null
  service_name_ar?: string | null
  category_name?: string | null
  category_name_ar?: string | null
  maalem_name?: string | null
  created_at?: string
  updated_at?: string
}

export interface OperationalNotification {
  id: number
  service_request_id: number
  intervention_id: number | null
  notification_type: string
  channel: 'IN_APP' | 'WHATSAPP'
  locale: 'fr' | 'ar'
  status: 'pending' | 'processing' | 'sent' | 'failed'
  title: string
  body: string
  created_at: string
  read_at: string | null
  action_url: string | null
  cta_label: string | null
}

export interface ReviewInvitationResolution {
  already_reviewed: boolean
  request: { id: number; request_number: string }
  maalem?: { id: number; public_name: string }
  expires_at?: string
}

export type ServiceRequestMode =
  | 'selected_maalem'
  | 'selected_service'
  | 'quick_request'

/**
 * Deliberately limited to information that may be displayed publicly.
 * Private contact details, documents and moderation history must never be
 * added to this contract.
 */
export interface PublicMaalemSummary {
  id: number
  public_name: string
  photo_url: string | null
  is_verified: true
  category: {
    id: number
    name: string | null
    name_ar: string | null
  }
  city: string | null
  intervention_areas: string[]
  skills: string[]
  experience_years: number | null
  professional_summary: string | null
}

export interface PublicMaalemReviewSummary {
  average_rating: number | null
  review_count: number
}

export interface PublicMaalemDetail extends PublicMaalemSummary {
  statistics: {
    closed_interventions: number
    last_closed_intervention_at: string | null
    by_service: Array<{ id: number; name: string | null; closed_interventions: number }>
    by_category: Array<{ id: number; name: string | null; closed_interventions: number }>
    average_rating: number | null
    review_count: number
    rating_distribution: Record<1 | 2 | 3 | 4 | 5, number>
  }
  compatible_services: PublicService[]
}

export interface PublicMaalemsResponse {
  maalems: Array<PublicMaalemSummary & { statistics: { closed_interventions: number; last_closed_intervention_at: string | null; average_rating: number | null; review_count: number } }>
  pagination: PublicServicesResponse['pagination']
  filters: { categories: PublicServiceCategory[]; services: Array<Pick<PublicService, 'id' | 'nom' | 'nom_ar'>>; rating_sort_min_reviews: number }
}

export interface PublicServiceCategory {
  id: number
  nom: string
  nom_ar: string
  description?: string | null
}

export interface PublicService {
  id: number
  nom: string
  nom_ar: string
  description: string | null
  description_ar: string | null
  image_url: string | null
  categories: PublicServiceCategory[]
}

export interface PublicServicesResponse {
  services: PublicService[]
  pagination: {
    current_page: number
    per_page: number
    total_items: number
    total_pages: number
    has_previous: boolean
    has_next: boolean
    from: number
    to: number
  }
  filters: {
    categories: PublicServiceCategory[]
  }
}

export interface CompatibleServiceMaalem {
  id: number
  public_name: string
  photo_url: string | null
  is_verified: true
  category: { id: number; name: string | null; name_ar: string | null }
  city: string | null
  intervention_areas: string[]
  closed_interventions_for_service: number
  average_rating: number | null
  review_count: number
}

export interface CompatibleServiceMaalemsResponse {
  maalems: CompatibleServiceMaalem[]
  pagination: PublicServicesResponse['pagination']
}

export interface PublicMaalemReview {
  rating: number
  comment: string | null
  submitted_at: string
  author_name: string | null
  verified_intervention: true
}

export interface PublicMaalemReviewsResponse {
  reviews: PublicMaalemReview[]
  pagination: PublicServicesResponse['pagination']
}

export interface ServiceRequestFormValues {
  problemDescription: string
  contactPhone: string
  city: string
  address: string
  latitude: number | null
  longitude: number | null
  desiredDate: string
  desiredTimeSlot: string
  sharedNote: string
  photos: File[]
}

export type ServiceRequestFormContext =
  | {
      mode: 'selected_maalem'
      requestedMaalemId: number
      maalem: PublicMaalemSummary
      serviceId?: number
    }
  | {
      mode: 'selected_service'
      serviceId: number
      serviceName: string
    }
  | {
      mode: 'quick_request'
    }

export interface ServiceRequestAttachment {
  id: number
  request_id: number
  kind: 'PHOTO' | 'DOCUMENT'
  original_name: string
  mime_type: string
  file_size: number
  created_at?: string
}

export interface CreateServiceRequestResponse {
  request: ServiceRequest
  attachments: ServiceRequestAttachment[]
  duplicate_submission?: boolean
}

export interface ServiceRequestDetails extends CreateServiceRequestResponse {
  shared_notes: Array<{
    id: number
    request_id: number
    body: string
    actor_type: 'CONTACT' | 'EMPLOYEE' | 'SYSTEM'
    actor_name: string
    created_at: string
  }>
}

export interface MaalemReview {
  id: number
  service_request_id: number
  rating: number
  comment: string | null
  status: 'pending' | 'published' | 'hidden' | 'rejected'
  submitted_at: string
  created_at: string
}

export interface MaalemReviewContext {
  eligible: boolean
  reason: string | null
  request: {
    id: number
    request_number: string
    status: string
  }
  maalem: {
    id: number
    public_name: string
  } | null
  review: MaalemReview | null
  constraints: {
    rating_min: number
    rating_max: number
    comment_min: number
    comment_max: number
    comment_required: false
    editable_after_publication: false
  }
}

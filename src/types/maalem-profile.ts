export type MaalemProfileStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'suspended'

export interface MaalemProfileCategory {
  id: number
  nom: string
  nom_ar: string
  is_active: boolean
  description?: string | null
}

export type MaalemAvailability =
  | 'immediate'
  | 'weekdays'
  | 'weekends'
  | 'evenings'
  | 'on_request'

export interface MaalemProfessionalData {
  skills: string[]
  contact_phone: string | null
  city: string | null
  intervention_areas: string[]
  experience_years: number | null
  professional_summary: string | null
  experiences: string | null
  availability: MaalemAvailability | null
  other_information: string | null
}

export interface MaalemProfileDocument {
  id: number
  profile_id: number
  kind: 'cv' | 'realization'
  original_name: string
  mime_type: string
  file_size: number
  created_at: string
}

export interface MaalemNotification {
  id: number
  profile_id: number
  notification_type: string
  source_event: string
  channel: 'IN_APP'
  locale: 'fr' | 'ar'
  status: 'sent'
  attempts: number
  title: string
  body: string
  created_at: string
  sent_at: string | null
  read_at: string | null
}

export interface MaalemProfile {
  id: number
  user_id: number
  contact_id: number
  category_id: number | null
  category: MaalemProfileCategory | null
  status: MaalemProfileStatus
  status_label: string
  origin: 'SELF_SERVICE' | 'NEW_REGISTRATION' | 'ARTISAN_CONVERSION' | 'TEAM_CREATED'
  created_by_employee_id: number | null
  professional_data: MaalemProfessionalData | null
  documents?: MaalemProfileDocument[]
  status_reason: string | null
  public_reason?: string | null
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: number | null
  created_at: string
  updated_at: string
}

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

export interface MaalemProfile {
  id: number
  user_id: number
  contact_id: number
  category_id: number | null
  category: MaalemProfileCategory | null
  status: MaalemProfileStatus
  status_label: string
  professional_data: MaalemProfessionalData | null
  documents?: MaalemProfileDocument[]
  status_reason: string | null
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: number | null
  created_at: string
  updated_at: string
}

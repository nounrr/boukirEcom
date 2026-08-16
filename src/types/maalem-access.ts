import type { MaalemProfileStatus } from './maalem-profile'

export type MaalemAccessDenialReason =
  | 'NO_MAALEM_PROFILE'
  | 'MAALEM_PROFILE_DRAFT'
  | 'MAALEM_PROFILE_SUBMITTED'
  | 'MAALEM_PROFILE_UNDER_REVIEW'
  | 'MAALEM_PROFILE_REJECTED'
  | 'MAALEM_PROFILE_SUSPENDED'
  | 'MAALEM_PROFILE_NOT_APPROVED'

export interface MaalemAccessDecision {
  allowed: boolean
  status: MaalemProfileStatus | null
  profile_id: number | null
  reason: MaalemAccessDenialReason | null
  capabilities: {
    operational_features: boolean
    service_assignments: boolean
  }
}


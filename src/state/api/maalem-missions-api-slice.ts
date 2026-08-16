import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithAuth } from '@/lib/base-query'

export type MissionStatus = 'scheduled' | 'to_do' | 'en_route' | 'arrived' | 'work_in_progress' | 'completed'

export interface MaalemMission {
  id: number
  service_request_id: number
  request_number: string
  mission_description: string | null
  status: MissionStatus
  planned_date: string | null
  planned_time_slot: string | null
  mission_address: string | null
  mission_city: string | null
  latitude: number | null
  longitude: number | null
  mission_contact_name: string | null
  mission_contact_phone: string | null
  shared_instructions: string | null
  special_information: string | null
  service_name: string | null
  category_name: string | null
  progress_percent: number
  work_summary: string | null
  maalem_observations: string | null
  work_finished: boolean | number | null
  additional_intervention_required: boolean | number | null
  incomplete_reason: string | null
  en_route_at: string | null
  arrived_at: string | null
  started_at: string | null
  completed_at: string | null
}

export interface MissionPhoto {
  id: number
  phase: 'BEFORE' | 'DURING' | 'AFTER'
  original_name: string
  mime_type: string
  file_size: number
  created_at: string
}

export const maalemMissionsApi = createApi({
  reducerPath: 'maalemMissionsApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['MaalemMission'],
  endpoints: (builder) => ({
    getMaalemMissions: builder.query<{ missions: MaalemMission[] }, void>({
      query: () => '/api/maalem-missions',
      providesTags: ['MaalemMission'],
    }),
    getMaalemMission: builder.query<{ mission: MaalemMission; photos: MissionPhoto[] }, number>({
      query: (id) => `/api/maalem-missions/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'MaalemMission', id }],
    }),
    transitionMaalemMission: builder.mutation<{ status: MissionStatus }, { id: number; status: MissionStatus }>({
      query: ({ id, status }) => ({ url: `/api/maalem-missions/${id}/transition`, method: 'POST', body: { status } }),
      invalidatesTags: (_result, _error, { id }) => ['MaalemMission', { type: 'MaalemMission', id }],
    }),
    updateMaalemMissionProgress: builder.mutation<void, { id: number; progress_percent: number }>({
      query: ({ id, progress_percent }) => ({ url: `/api/maalem-missions/${id}/progress`, method: 'PATCH', body: { progress_percent } }),
      invalidatesTags: (_result, _error, { id }) => ['MaalemMission', { type: 'MaalemMission', id }],
    }),
    updateMaalemMissionReport: builder.mutation<void, { id: number; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/api/maalem-missions/${id}/report`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => ['MaalemMission', { type: 'MaalemMission', id }],
    }),
  }),
})

export const {
  useGetMaalemMissionsQuery,
  useGetMaalemMissionQuery,
  useTransitionMaalemMissionMutation,
  useUpdateMaalemMissionProgressMutation,
  useUpdateMaalemMissionReportMutation,
} = maalemMissionsApi

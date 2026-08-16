export type ServiceRequestStatusKey =
  | 'new'
  | 'underReview'
  | 'assigned'
  | 'inProgress'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'unknown'

export interface ServiceRequestStatusPresentation {
  key: ServiceRequestStatusKey
  color: string
  background: string
  border: string
  accent: string
  progressIndex: number
  terminal: boolean
}

const neutralStatus: ServiceRequestStatusPresentation = {
  key: 'unknown',
  color: 'text-gray-600 dark:text-gray-300',
  background: 'bg-gray-50 dark:bg-gray-950/30',
  border: 'border-gray-300 dark:border-gray-700',
  accent: 'border-s-gray-400',
  progressIndex: -1,
  terminal: false,
}

export function getServiceRequestStatusPresentation(status: string): ServiceRequestStatusPresentation {
  switch (status) {
    case 'new':
      return {
        key: 'new',
        color: 'text-amber-600 dark:text-amber-400',
        background: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-500/50',
        accent: 'border-s-amber-500',
        progressIndex: 0,
        terminal: false,
      }
    case 'under_review':
    case 'reviewing':
    case 'qualified':
      return {
        key: 'underReview',
        color: 'text-blue-600 dark:text-blue-400',
        background: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-500/50',
        accent: 'border-s-blue-500',
        progressIndex: 1,
        terminal: false,
      }
    case 'assigned':
    case 'maalem_assigned':
      return {
        key: 'assigned',
        color: 'text-violet-600 dark:text-violet-400',
        background: 'bg-violet-50 dark:bg-violet-950/30',
        border: 'border-violet-500/50',
        accent: 'border-s-violet-500',
        progressIndex: 2,
        terminal: false,
      }
    case 'in_progress':
      return {
        key: 'inProgress',
        color: 'text-cyan-700 dark:text-cyan-300',
        background: 'bg-cyan-50 dark:bg-cyan-950/30',
        border: 'border-cyan-500/50',
        accent: 'border-s-cyan-500',
        progressIndex: 3,
        terminal: false,
      }
    case 'completed':
    case 'resolved':
      return {
        key: 'completed',
        color: 'text-emerald-600 dark:text-emerald-400',
        background: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-500/50',
        accent: 'border-s-emerald-500',
        progressIndex: 4,
        terminal: false,
      }
    case 'cancelled':
      return {
        key: 'cancelled',
        color: 'text-red-600 dark:text-red-400',
        background: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-500/50',
        accent: 'border-s-red-500',
        progressIndex: -1,
        terminal: true,
      }
    case 'rejected':
      return {
        key: 'rejected',
        color: 'text-red-600 dark:text-red-400',
        background: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-500/50',
        accent: 'border-s-red-500',
        progressIndex: -1,
        terminal: true,
      }
    default:
      return neutralStatus
  }
}

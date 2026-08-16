import type { ServiceRequestFormValues } from '@/types/service-request'

export const SERVICE_REQUEST_LIMITS = {
  description: 10_000,
  phone: 50,
  city: 100,
  address: 500,
  sharedNote: 5_000,
  desiredTimeSlot: 100,
  photos: 8,
  photoBytes: 8 * 1024 * 1024,
} as const

export const SERVICE_REQUEST_PHOTO_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

export type ServiceRequestField =
  | 'problemDescription'
  | 'contactPhone'
  | 'city'
  | 'address'
  | 'latitude'
  | 'longitude'
  | 'desiredDate'
  | 'desiredTimeSlot'
  | 'sharedNote'
  | 'photos'
  | 'form'

export type ServiceRequestValidationErrors = Partial<Record<ServiceRequestField, string>>

export interface ValidationMessages {
  descriptionRequired: string
  phoneRequired: string
  cityRequired: string
  addressRequired: string
  dateRequired: string
  timeSlotRequired: string
  tooLong: string
  datePast: string
  gpsPair: string
  gpsInvalid: string
  tooManyPhotos: string
  photoInvalid: string
}

export interface ServiceRequestValidationOptions {
  addressRequired?: boolean
  desiredDateRequired?: boolean
  desiredTimeSlotRequired?: boolean
}

function localDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getTodayForDateInput(now = new Date()): string {
  return localDateString(now)
}

export function validateServiceRequest(
  values: ServiceRequestFormValues,
  messages: ValidationMessages,
  now = new Date(),
  options: ServiceRequestValidationOptions = {},
): ServiceRequestValidationErrors {
  const errors: ServiceRequestValidationErrors = {}
  const description = values.problemDescription.trim()
  const phone = values.contactPhone.trim()
  const city = values.city.trim()
  const address = values.address.trim()

  if (!description) errors.problemDescription = messages.descriptionRequired
  else if (description.length > SERVICE_REQUEST_LIMITS.description) errors.problemDescription = messages.tooLong
  if (!phone) errors.contactPhone = messages.phoneRequired
  else if (phone.length > SERVICE_REQUEST_LIMITS.phone) errors.contactPhone = messages.tooLong
  if (!city) errors.city = messages.cityRequired
  else if (city.length > SERVICE_REQUEST_LIMITS.city) errors.city = messages.tooLong
  if (options.addressRequired !== false && !address) errors.address = messages.addressRequired
  else if (address.length > SERVICE_REQUEST_LIMITS.address) errors.address = messages.tooLong
  if (values.sharedNote.length > SERVICE_REQUEST_LIMITS.sharedNote) errors.sharedNote = messages.tooLong
  if (options.desiredTimeSlotRequired && !values.desiredTimeSlot.trim()) {
    errors.desiredTimeSlot = messages.timeSlotRequired
  } else if (values.desiredTimeSlot.length > SERVICE_REQUEST_LIMITS.desiredTimeSlot) {
    errors.desiredTimeSlot = messages.tooLong
  }
  if (options.desiredDateRequired && !values.desiredDate) errors.desiredDate = messages.dateRequired
  else if (values.desiredDate && values.desiredDate < localDateString(now)) errors.desiredDate = messages.datePast

  const hasLatitude = values.latitude != null
  const hasLongitude = values.longitude != null
  if (hasLatitude !== hasLongitude) {
    errors.latitude = messages.gpsPair
    errors.longitude = messages.gpsPair
  } else if (
    (hasLatitude && (values.latitude! < -90 || values.latitude! > 90))
    || (hasLongitude && (values.longitude! < -180 || values.longitude! > 180))
  ) {
    errors.latitude = messages.gpsInvalid
    errors.longitude = messages.gpsInvalid
  }

  if (values.photos.length > SERVICE_REQUEST_LIMITS.photos) {
    errors.photos = messages.tooManyPhotos
  } else if (values.photos.some(
    (photo) => !SERVICE_REQUEST_PHOTO_TYPES.has(photo.type) || photo.size > SERVICE_REQUEST_LIMITS.photoBytes,
  )) {
    errors.photos = messages.photoInvalid
  }
  return errors
}

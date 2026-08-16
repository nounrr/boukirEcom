import type { PublicService, PublicServiceCategory } from '@/types/service-request'

export type ServiceCatalogueLocale = 'fr' | 'ar' | 'en' | 'zh'

export function localizedServiceText(
  item: Pick<PublicService, 'nom' | 'nom_ar' | 'description' | 'description_ar'>,
  locale: string,
) {
  const arabic = locale === 'ar'
  return {
    name: (arabic ? item.nom_ar : item.nom) || item.nom || item.nom_ar,
    description: (arabic ? item.description_ar : item.description) || item.description || item.description_ar,
  }
}

export function localizedCategoryName(category: PublicServiceCategory, locale: string) {
  return (locale === 'ar' ? category.nom_ar : category.nom) || category.nom || category.nom_ar
}

export function serviceDetailHref(locale: string, serviceId: number) {
  return `/${locale}/services/${serviceId}`
}

export function serviceRequestHref(locale: string, serviceId: number) {
  return `/${locale}/services/${serviceId}/request`
}

export function quickServiceRequestHref(locale: string) {
  return `/${locale}/services/request/quick`
}

export function serviceMaalemRequestHref(locale: string, maalemId: number, serviceId: number) {
  return `/${locale}/service-requests/maalem/${maalemId}?service_id=${serviceId}`
}

export function catalogueHref(
  locale: string,
  filters: { q?: string; category_id?: string | number; page?: number },
) {
  const params = new URLSearchParams()
  if (filters.q?.trim()) params.set('q', filters.q.trim())
  if (filters.category_id) params.set('category_id', String(filters.category_id))
  if (filters.page && filters.page > 1) params.set('page', String(filters.page))
  const query = params.toString()
  return `/${locale}/services${query ? `?${query}` : ''}`
}

import type { PublicService } from '@/types/service-request'

export type ServiceCatalogueLocale = 'fr' | 'ar' | 'en' | 'zh'

type LocalizedValues = { fr?: string | null; ar?: string | null; en?: string | null; zh?: string | null }

/**
 * Texte dans la langue du visiteur, sinon en français, sinon dans la première langue saisie.
 * Les traductions anglaise et chinoise sont facultatives dans le back-office.
 */
export function pickLocalizedText(values: LocalizedValues, locale: string): string | null {
  const key: ServiceCatalogueLocale = locale === 'ar' || locale === 'en' || locale === 'zh' ? locale : 'fr'
  for (const candidate of [values[key], values.fr, values.ar, values.en, values.zh]) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate
  }
  return null
}

export function localizedServiceText(
  item: Pick<PublicService, 'nom' | 'nom_ar' | 'description' | 'description_ar'>
    & Partial<Pick<PublicService, 'nom_en' | 'nom_zh' | 'description_en' | 'description_zh'>>,
  locale: string,
) {
  return {
    name: pickLocalizedText({ fr: item.nom, ar: item.nom_ar, en: item.nom_en, zh: item.nom_zh }, locale) || item.nom,
    description: pickLocalizedText(
      { fr: item.description, ar: item.description_ar, en: item.description_en, zh: item.description_zh },
      locale,
    ),
  }
}

/** Nom d'une catégorie Maalem ou d'un service (champs nom, nom_ar, nom_en, nom_zh). */
export function localizedCategoryName(
  category: { id?: number; nom: string; nom_ar?: string | null; nom_en?: string | null; nom_zh?: string | null },
  locale: string,
) {
  return pickLocalizedText({ fr: category.nom, ar: category.nom_ar, en: category.nom_en, zh: category.nom_zh }, locale) || category.nom
}

/** Catégorie d'un Maalem dans les fiches publiques (champs name, name_ar, name_en, name_zh). */
export function localizedMaalemCategoryName(
  category: { name: string | null; name_ar: string | null; name_en?: string | null; name_zh?: string | null } | null | undefined,
  locale: string,
) {
  if (!category) return ''
  return pickLocalizedText({ fr: category.name, ar: category.name_ar, en: category.name_en, zh: category.name_zh }, locale) || ''
}

/** Service ou catégorie d'une demande d'intervention, dans la langue du visiteur. */
export function localizedRequestNames(
  request: {
    service_name?: string | null; service_name_ar?: string | null; service_name_en?: string | null; service_name_zh?: string | null
    category_name?: string | null; category_name_ar?: string | null; category_name_en?: string | null; category_name_zh?: string | null
  },
  locale: string,
) {
  return {
    service: pickLocalizedText({ fr: request.service_name, ar: request.service_name_ar, en: request.service_name_en, zh: request.service_name_zh }, locale),
    category: pickLocalizedText({ fr: request.category_name, ar: request.category_name_ar, en: request.category_name_en, zh: request.category_name_zh }, locale),
  }
}

export function serviceDetailHref(locale: string, serviceId: number) {
  return `/${locale}/services/${serviceId}`
}

export function serviceRequestHref(locale: string, serviceId: number) {
  return `/${locale}/services/${serviceId}/request`
}

export function quickServiceRequestHref(locale: string, returnTo?: string) {
  const path = `/${locale}/services/request/quick`
  return returnTo ? `${path}?returnTo=${encodeURIComponent(returnTo)}` : path
}

export function quickServiceRequestReturnHref(locale: string, returnTo: string | null, origin: string) {
  const fallback = `/${locale}/services`
  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) return fallback
  try {
    const target = new URL(returnTo, origin)
    const allowed = new RegExp(`^/${locale}/(?:services|maalems)(?:/\\d+)?$`)
    return target.origin === origin && allowed.test(target.pathname)
      ? `${target.pathname}${target.search}`
      : fallback
  } catch {
    return fallback
  }
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

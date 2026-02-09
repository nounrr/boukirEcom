/**
 * Hero Slides API Types
 * Mirrors the public endpoint: GET /api/hero-slides?locale=fr&limit=4
 *
 * Notes:
 * - Backend does NOT return hrefs. Frontend derives navigation URLs from `type` + `target.*`.
 * - Some optional legacy fields are kept for backward compatibility.
 */

export type HeroSlideTypeApi = 'category' | 'brand' | 'campaign' | 'product'

export type HeroSlidesLocale = 'fr' | 'ar' | 'en' | 'zh'

export type LocalizedText = string | Record<HeroSlidesLocale, string | null | undefined>

export interface HeroSlidesRequest {
  locale: HeroSlidesLocale
  limit?: number
  /**
   * Optional ISO date-time string used by backend to resolve scheduling.
   * If omitted, backend should use "now".
   */
  now?: string
}

export interface HeroSlideMediaApi {
  image_url: string
  image_alt?: string | null
  secondary_image_url?: string | null
  secondary_image_alt?: string | null
}

export interface HeroSlideContentApi {
  title: LocalizedText
  subtitle?: LocalizedText | null
  description?: LocalizedText | null
  badge?: LocalizedText | null
}

export interface HeroSlideContentResolvedApi {
  locale: HeroSlidesLocale
  title: string
  subtitle?: string | null
  description?: string | null
}

export interface HeroSlideTargetApi {
  /**
   * Prefer these explicit keys (new backend contract).
   */
  category_id?: number | null
  brand_id?: number | null
  product_id?: number | null
  campaign_id?: number | null

  /**
   * Legacy/optional keys.
   */
  id?: number | string | null
  slug?: string | null
}

export interface HeroSlideCtaButtonApi {
  label: string
  label_ar?: string | null
  label_en?: string | null
  label_zh?: string | null
}

export interface HeroSlideCtaApi {
  primary: HeroSlideCtaButtonApi
  secondary?: HeroSlideCtaButtonApi | null
}

export interface HeroSlideCtaResolvedApi {
  primary?: {
    label: string
  } | null
  secondary?: {
    label: string
  } | null
}

/**
 * Legacy CTA format (deprecated): backend-provided hrefs.
 */
export interface HeroSlideCtaLegacyApi {
  label: string
  label_ar?: string | null
  label_en?: string | null
  label_zh?: string | null
  href?: string
  style?: 'primary' | 'secondary' | string
  variant?: 'primary' | 'secondary' | 'outline' | 'link'
}

export interface HeroSlideApi {
  id: number | string
  type: HeroSlideTypeApi
  locale?: HeroSlidesLocale | null
  priority?: number | null
  start_at?: string | null
  end_at?: string | null
  status?: 'draft' | 'published' | 'archived' | string

  media: HeroSlideMediaApi
  content: HeroSlideContentApi
  content_resolved?: HeroSlideContentResolvedApi | null
  target?: HeroSlideTargetApi | null

  /**
   * New contract.
   */
  cta?: HeroSlideCtaApi | null

  cta_resolved?: HeroSlideCtaResolvedApi | null

  /**
   * Legacy contract (deprecated).
   */
  ctas?: HeroSlideCtaLegacyApi[] | null

  ctas_resolved?: Array<{
    style?: 'primary' | 'secondary' | string
    label: string
  }> | null
}

export interface HeroSlidesResponse {
  slides: HeroSlideApi[]
}

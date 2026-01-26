/**
 * Hero Slides API Types
 * Mirrors the public endpoint: GET /api/hero-slides?locale=fr&limit=4
 *
 * Notes:
 * - Backend does NOT return hrefs. Frontend derives navigation URLs from `type` + `target.*`.
 * - Some optional legacy fields are kept for backward compatibility.
 */

export type HeroSlideTypeApi = 'category' | 'brand' | 'campaign' | 'product'

export interface HeroSlidesRequest {
  locale: 'fr' | 'ar'
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
}

export interface HeroSlideContentApi {
  title: string
  subtitle?: string | null
  badge?: string | null
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
}

export interface HeroSlideCtaApi {
  primary: HeroSlideCtaButtonApi
  secondary?: HeroSlideCtaButtonApi | null
}

/**
 * Legacy CTA format (deprecated): backend-provided hrefs.
 */
export interface HeroSlideCtaLegacyApi {
  label: string
  href: string
  variant?: 'primary' | 'secondary' | 'outline' | 'link'
}

export interface HeroSlideApi {
  id: number | string
  type: HeroSlideTypeApi
  locale?: 'fr' | 'ar' | null
  priority?: number | null
  start_at?: string | null
  end_at?: string | null
  status?: 'draft' | 'published' | 'archived' | string

  media: HeroSlideMediaApi
  content: HeroSlideContentApi
  target?: HeroSlideTargetApi | null

  /**
   * New contract.
   */
  cta?: HeroSlideCtaApi | null

  /**
   * Legacy contract (deprecated).
   */
  ctas?: HeroSlideCtaLegacyApi[] | null
}

export interface HeroSlidesResponse {
  slides: HeroSlideApi[]
}

/**
 * Search Suggestions API Types
 * GET /api/ecommerce/search/suggestions
 */

export interface SearchSuggestionsRequest {
  q: string
  limit_products?: number
  limit_categories?: number
  limit_brands?: number
  in_stock_only?: boolean
}

export interface SearchSuggestionCategory {
  id: number
  nom: string
  nom_ar?: string | null
  nom_en?: string | null
  nom_zh?: string | null
  parent_id?: number | null
  image_url?: string | null
  category_ids_scope?: number[]
}

export interface SearchSuggestionBrand {
  id: number
  nom: string
  image_url?: string | null
}

export interface SearchSuggestionProduct {
  id: number
  designation: string
  designation_ar?: string | null
  designation_en?: string | null
  designation_zh?: string | null
  prix_vente: number
  prix_promo: number | null
  pourcentage_promo: number
  has_promo: boolean
  image_url: string | null
  in_stock: boolean
  brand: SearchSuggestionBrand
  categorie: SearchSuggestionCategory
}

export interface SearchSuggestionsIntent {
  detected_category: SearchSuggestionCategory | null
  detected_brand: SearchSuggestionBrand | null
  remaining_query: string
}

export interface SearchSuggestionsResponse {
  query: string
  normalized_query: string
  intent: SearchSuggestionsIntent
  categories: SearchSuggestionCategory[]
  brands: SearchSuggestionBrand[]
  products: SearchSuggestionProduct[]
}

/**
 * Product API Types
 * Based on E-Commerce API Documentation
 */

// ============================================================================
// Request Types
// ============================================================================

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'promo' | 'popular';

export interface ProductFiltersRequest {
  // Pagination
  page?: number;
  per_page?: number;
  limit?: number;
  
  // Filters
  category_id?: number | number[] | string;
  brand_id?: number | number[] | string;
  color?: string | string[];
  unit?: string | string[];
  search?: string;
  min_price?: number;
  max_price?: number;
  in_stock_only?: boolean;
  sort?: SortOption;
}

// ============================================================================
// Response Types
// ============================================================================

export interface ProductVariant {
  id: number;
  name: string;
  type: string;
  prix_vente: number;
  remise_client: number;
  remise_artisan: number;
  stock_quantity: number;
  available: boolean;
  image_url: string | null;
}

export interface ProductVariants {
  all: ProductVariant[];
  colors: {
    id: number;
    name: string;
    image_url: string | null;
    available: boolean;
  }[] | null;
  sizes: {
    id: number;
    name: string;
    available: boolean;
  }[] | null;
  other: ProductVariant[] | null;
}

export interface ProductUnit {
  id: number;
  unit_name: string; // API field
  name?: string; // optional alias for legacy
  conversion_factor: number;
  prix_vente: number | null;
  is_default: boolean;
}

export interface ProductGalleryImage {
  id: number;
  image_url: string;
  position: number;
}

export interface ProductBrand {
  id: number;
  nom: string;
  image_url: string | null;
  description?: string;
}

export interface ProductCategory {
  id: number;
  nom: string;
  nom_ar?: string | null;
  nom_en?: string | null;
  nom_zh?: string | null;
  parent_id?: number | null;
  children?: ProductCategory[];
}

export interface ProductListItem {
  id: number;
  designation: string;
  designation_ar?: string;
  designation_en?: string;
  designation_zh?: string;
  prix_vente: number;
  prix_promo: number | null;
  pourcentage_promo: number;
  remise_client: number;
  remise_artisan: number;
  has_promo: boolean;
  image_url: string;
  gallery: ProductGalleryImage[];
  quantite_disponible: number;
  has_variants: boolean;
  is_obligatoire_variant?: boolean;
  isObligatoireVariant?: boolean;
  base_unit: string;
  categorie_base: string;
  variants: ProductVariants;
  units: ProductUnit[] | null;
  brand: ProductBrand;
  categorie: {
    id: number;
    nom: string;
    nom_ar?: string | null;
    nom_en?: string | null;
    nom_zh?: string | null;
  };
  is_wishlisted?: boolean;
}

export interface ProductDetail extends Omit<ProductListItem, 'variants'> {
  description?: string;
  description_ar?: string;
  description_en?: string;
  description_zh?: string;
  fiche_technique?: string;
  fiche_technique_ar?: string;
  fiche_technique_en?: string;
  fiche_technique_zh?: string;
  kg: number | null;
  est_service: boolean;
  in_stock: boolean;
  variants: {
    id: number;
    variant_name: string;
    variant_type: string;
    reference: string;
    prix_vente: number;
    remise_client: number;
    remise_artisan: number;
    stock_quantity: number;
    available: boolean;
    image_url: string | null;
    gallery: ProductGalleryImage[];
  }[];
  similar_products: ProductListItem[];
  suggestions?: ProductListItem[]; // optional suggestions list from API
  created_at?: string;
  updated_at?: string;
}

export interface Pagination {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  has_previous: boolean;
  has_next: boolean;
  from: number;
  to: number;
}

export interface FiltersMetadata {
  categories: ProductCategory[];
  colors: string[];
  units: string[];
  brands: ProductBrand[];
  price_range: {
    min: number;
    max: number;
  };
}

export interface ProductsListResponse {
  products: ProductListItem[];
  pagination: Pagination;
  filters: FiltersMetadata;
}

// ============================================================================
// Frontend Filter State (for UI components)
// ============================================================================

export interface FilterState {
  categories: number[];
  brands: number[];
  priceRange: [number, number];
  colors: string[];
  units: string[];
  search: string;
  inStock: boolean;
  sort: SortOption;
  page: number;
  per_page: number;
}

// ============================================================================
// Helper function to convert FilterState to API request
// ============================================================================

export function filterStateToApiRequest(state: FilterState): ProductFiltersRequest {
  const request: ProductFiltersRequest = {
    page: state.page,
    per_page: state.per_page,
    sort: state.sort,
    in_stock_only: state.inStock,
  };

  if (state.categories.length > 0) {
    request.category_id = state.categories;
  }

  if (state.brands.length > 0) {
    request.brand_id = state.brands;
  }

  if (state.colors.length > 0) {
    request.color = state.colors;
  }

  if (state.units.length > 0) {
    request.unit = state.units;
  }

  if (state.search) {
    request.search = state.search;
  }

  if (state.priceRange[0] > 0 || state.priceRange[1] < 10000) {
    request.min_price = state.priceRange[0];
    request.max_price = state.priceRange[1];
  }

  return request;
}

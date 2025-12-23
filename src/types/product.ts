export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  categoryId: string;
  category?: Category;
  brand?: string;
  images: string[];
  gallery?: { id: number; image_url: string; position: number }[];
  stock: number;
  availability: 'in_stock' | 'out_of_stock' | 'on_order';
  isFeatured?: boolean;
  isWishlisted?: boolean;
  variants?: Array<{
    id: number;
    variant_name?: string;
    variant_type?: string;
    value?: string;
    prix_vente?: number;
    available?: boolean;
    image_url?: string;
  }>;
  units?: Array<{
    id: number;
    unit_name: string;
    conversion_factor: number;
    prix_vente: number;
    is_default: boolean;
  }>;
  suggestions?: Array<{
    id: number;
    designation: string;
    prix_vente: number;
    prix_promo?: number | null;
    pourcentage_promo?: number;
    image_url: string;
    quantite_disponible: number;
    has_variants: boolean;
    categorie?: { id: number; nom: string };
    is_wishlisted?: boolean | null;
  }>;
  specifications?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'name' | 'newest';
}

export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  image?: string;
  parentId?: string;
  children?: Category[];
}

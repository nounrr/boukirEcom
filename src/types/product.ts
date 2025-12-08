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
  stock: number;
  availability: 'in_stock' | 'out_of_stock' | 'on_order';
  isFeatured?: boolean;
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

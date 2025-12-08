export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  parentId?: string;
  children?: Category[];
  productsCount?: number;
  createdAt: string;
  updatedAt: string;
}

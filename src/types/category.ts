export interface Category {
  id: number;
  nom: string;
  nom_ar?: string | null;
  nom_en?: string | null;
  nom_zh?: string | null;
  description?: string | null;
  image_url?: string | null;
  parent_id?: number | null;
  children?: Category[];
  created_at?: string;
  updated_at?: string;
}

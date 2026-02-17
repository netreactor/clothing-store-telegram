export interface Category {
  id: number;
  name: string;
  icon?: string;
  created_at: string;
}

export interface Subcategory {
  id: number;
  name: string;
  category_id: number;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  article: string;
  description: string;
  image_url: string;
  rating: number;
  order_link: string;
  subcategory_id: number;
  created_at: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  author_id: number;
  author_name: string;
  created_at: string;
}

export interface AdminUser {
  id: number;
  username: string;
  password: string;
  is_master: boolean;
  can_manage_categories: boolean;
  can_manage_products: boolean;
  can_manage_posts: boolean;
  can_manage_admins: boolean;
  created_at: string;
}

export interface HeroContent {
  id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface HeroSlide {
  id: number;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface CategoryWithSubcategories extends Category {
  subcategories: Subcategory[];
}

export interface SubcategoryWithProducts extends Subcategory {
  products: Product[];
}

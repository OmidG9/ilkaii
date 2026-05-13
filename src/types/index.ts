export interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice?: number;
  heroImage?: string;
  categoryId: string;
  status: 'ACTIVE' | 'DRAFT' | 'INACTIVE' | 'DISCONTINUED';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  icon?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface User {
  id: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isVerified: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    nameAr?: string;
    price: number;
    image: string;
    stock: number;
  };
  quantity: number;
  price: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  updatedAt: string;
}

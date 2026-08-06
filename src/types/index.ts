export interface Product {
  id: number;
  name: string;
  description?: string;
  price?: any;
  unit_price?: any;
  amount?: any;
  vat_rate?: number | string; // 🚀 Dynamic TVA (5.50, 10.00, 20.00) from Laravel DB
  image: string | null;
  is_active?: boolean;
  category_id?: number;
  category_name?: string;
}

export interface ClientProfile {
  id?: number | string; // 🚀 FIX: Accepts both string (NextAuth) and number (Laravel DB)
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  userType?: 'client' | 'staff';
  role?: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name?: string;
  name?: string;
  quantity: number;
  unit_price?: number;
  price?: number;
}

export interface Order {
  id: number;
  sequence_number?: number;
  preparation_status?: string;
  status?: string;
  total_amount?: number;
  total_incl_vat?: number;
  created_at: string;
  items?: OrderItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string[];
  extraPrice?: number; // Stores extra cost from paid suppléments (+€1.50 Bacon, etc.)
}
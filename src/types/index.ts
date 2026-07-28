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
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
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
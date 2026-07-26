// export interface Product {
//   id: number;
//   name: string;
//   description: string;
//   price: number;
//   image: string | null;
//   is_active: boolean;
//   category_id?: number;
// }

export interface Product {
  id: number;
  name: string;
  description?: string;
  price?: any;
  unit_price?: any;
  amount?: any;
  image: string | null;
  is_active?: boolean;
  category_id?: number;
  category_name?: string;
}
export interface Review {
  id: number;
  name: string;
  comment: string;
  rating: number;
  date: string;
}
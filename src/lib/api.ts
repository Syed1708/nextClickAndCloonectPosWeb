import { Product } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  order_number: string;
  status: 'pending' | 'preparing' | 'packing' | 'ready' | 'completed' | 'cancelled';
  total_amount: number;
  created_at: string;
  items?: OrderItem[];
}



export function formatPrice(price: any): string {
  if (price === null || price === undefined || price === '') return '0.00';
  const sanitized = typeof price === 'string' ? price.replace(',', '.') : price;
  const num = parseFloat(sanitized);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
}

// export function getImageUrl(imagePath: string | null | undefined): string {
  
//   if (!imagePath || imagePath === 'null' || imagePath === 'undefined' || imagePath.trim() === '') {
//     return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="%2318181b"><rect width="400" height="300"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2371717a" font-family="sans-serif" font-size="16" font-weight="bold">Burger Palace</text></svg>`;
//   }
//   if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
//     return imagePath;
//   }
//   return `${API_BASE_URL}/storage/${imagePath.replace(/^\//, '')}`;
// }


// src/lib/api.ts

export function getImageUrl(imagePath?: string | null): string {
  if (!imagePath) {
    return '/images/placeholder-burger.jpg'; // Fallback placeholder
  }

  // If already a full URL (e.g. https://...)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  const cleanPath = imagePath.replace(/^\/+/, ''); // Strip leading slashes

  // 🚀 Converts "uploads/eSP165p..." to "http://127.0.0.1:8000/storage/uploads/eSP165p..."
  if (cleanPath.startsWith('uploads/')) {
    return `${apiBase}/storage/${cleanPath}`;
  }

  if (cleanPath.startsWith('storage/')) {
    return `${apiBase}/${cleanPath}`;
  }

  return `${apiBase}/storage/${cleanPath}`;
}

export async function fetchMenu(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/menu`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Failed to fetch menu');

    const data = await res.json();
    const payload = data.data || data;

    if (!Array.isArray(payload)) return [];

    // Check if the payload is an array of categories with nested products/items
    if (payload.length > 0 && (payload[0].products || payload[0].items)) {
      const allProducts: Product[] = payload.flatMap((category: any) => {
        const categoryProducts = category.products || category.items || [];
        
        // Unpack products and attach category_name
        return categoryProducts.map((prod: any) => ({
          ...prod,
          category_name: category.name || category.title || 'Burgers',
          category_id: category.id,
        }));
      });

      return allProducts;
    }

    // If it's already a flat array of products
    return payload;
  } catch (err) {
    console.error('Menu Fetch Error:', err);
    return [];
  }
}
// --- REAL AUTHENTICATION & PROFILE API CALLS ---

export async function fetchUserProfile(token: string): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || data;
  } catch (err) {
    console.error('User Fetch Error:', err);
    return null;
  }
}

export async function fetchUserOrders(token: string): Promise<Order[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const payload = data.data || data;
    return Array.isArray(payload) ? payload : [];
  } catch (err) {
    console.error('Orders Fetch Error:', err);
    return [];
  }
}
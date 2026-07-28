import Dexie, { type Table } from 'dexie';

export interface LocalCategory {
  id: number;
  name: string;
}

export interface LocalProduct {
  id: number;
  category_id: number;
  name: string;
  price: number;
  vat_rate: number;
  is_active: number;
  category_name?: string;
  image?: string | null;
}

export interface LocalOrder {
  uuid: string;
  sequence_number: number;
  subtotal_excl_vat: number;
  vat_amount: number;
  total_incl_vat: number;
  hash: string;
  previous_hash: string;
  completed_at: string;
  customer_name?: string;
  customer_phone?: string | null;
  order_type?: string;
  is_synced: number; // 0 = unsynced, 1 = synced
  local_daily_closure_id?: number | null; // 🚀 Freezes order upon Z-Closure
}

export interface LocalOrderItem {
  id?: number;
  order_uuid: string;
  product_id?: number | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  subtotal: number;
}

export interface LocalPayment {
  id?: number;
  order_uuid: string;
  amount: number;
  method: string;
}

export interface LocalDailyClosure {
  id?: number;
  z_number: number;
  total_ttc: number;
  total_ht: number;
  total_tva: number;
  hash: string;
  previous_hash: string;
  closed_at: string;
  is_synced: number;
}

export class PosDatabase extends Dexie {
  categories!: Table<LocalCategory>;
  products!: Table<LocalProduct>;
  orders!: Table<LocalOrder, string>;
  orderItems!: Table<LocalOrderItem>;
  payments!: Table<LocalPayment>;
  dailyClosures!: Table<LocalDailyClosure>;

  constructor() {
    super('BurgerPalacePosDB');
    this.version(2).stores({
      categories: 'id, name',
      products: 'id, category_id, name, is_active',
      orders: 'uuid, sequence_number, completed_at, is_synced, local_daily_closure_id',
      orderItems: '++id, order_uuid, product_id',
      payments: '++id, order_uuid, method',
      dailyClosures: '++id, &z_number, closed_at, is_synced',
    });
  }
}

export const db = new PosDatabase();
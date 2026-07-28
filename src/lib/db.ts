import Dexie, { type Table } from 'dexie';

export interface PosOfflineOrder {
  id?: number;
  localUuid: string;
  createdAt: string;
  payload: any;
  status: 'pending' | 'syncing' | 'failed';
}

export interface CachedProduct {
  id: number;
  name: string;
  price: number;
  image: string | null;
  category_name?: string;
}

export class PosDatabase extends Dexie {
  offlineOrders!: Table<PosOfflineOrder>;
  cachedProducts!: Table<CachedProduct>;

  constructor() {
    super('BurgerPalacePosDB');
    this.version(1).stores({
      offlineOrders: '++id, localUuid, createdAt, status',
      cachedProducts: 'id, name, category_name',
    });
  }
}

export const db = new PosDatabase();
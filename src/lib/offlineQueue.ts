import { db, PosOfflineOrder } from './db';

export async function saveOfflineOrderToDexie(payload: any): Promise<PosOfflineOrder> {
  const localUuid = `OFFLINE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const record: PosOfflineOrder = {
    localUuid,
    createdAt: new Date().toISOString(),
    payload,
    status: 'pending',
  };

  const id = await db.offlineOrders.add(record);
  return { ...record, id: Number(id) };
}

export async function getPendingOfflineOrdersCount(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  return await db.offlineOrders.where('status').equals('pending').count();
}

export async function syncOfflineOrdersFromDexie(
  accessToken: string | null
): Promise<{ synced: number; failed: number }> {
  const pendingOrders = await db.offlineOrders.where('status').equals('pending').toArray();

  if (pendingOrders.length === 0) return { synced: 0, failed: 0 };

  let syncedCount = 0;
  let failedCount = 0;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  for (const item of pendingOrders) {
    try {
      if (item.id) {
        await db.offlineOrders.update(item.id, { status: 'syncing' });
      }

      console.log('🚀 [Dexie Syncing Payload]:', item.payload);

      const res = await fetch(`${API_URL}/api/orders/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(item.payload),
      });

      const resData = await res.json().catch(() => null);

      if (res.ok) {
        console.log('✅ [Dexie Sync Success]:', item.localUuid, resData);
        if (item.id) {
          await db.offlineOrders.delete(item.id);
        }
        syncedCount++;
      } else {
        // 🚀 PRINT EXACT LARAVEL REJECTION REASON IN CONSOLE!
        console.error(`❌ [Laravel Rejected Sync - HTTP ${res.status}]:`, resData);

        if (item.id) {
          await db.offlineOrders.update(item.id, { status: 'pending' });
        }
        failedCount++;
      }
    } catch (err) {
      console.error('❌ [Network Error during Dexie Sync]:', err);
      if (item.id) {
        await db.offlineOrders.update(item.id, { status: 'pending' });
      }
      failedCount++;
      break;
    }
  }

  return { synced: syncedCount, failed: failedCount };
}
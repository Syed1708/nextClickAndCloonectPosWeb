import { db, PosOfflineOrder } from './db';

/**
 * Saves a POS order directly into IndexedDB (Dexie.js)
 */
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

/**
 * Gets count of unsynced offline orders in IndexedDB
 */
export async function getPendingOfflineOrdersCount(): Promise<number> {
  return await db.offlineOrders.where('status').equals('pending').count();
}

/**
 * Silent Background Auto-Sync Engine:
 * Pulls pending tickets from IndexedDB and posts them to Laravel /api/orders/sync
 */
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
      // Mark status as syncing
      if (item.id) {
        await db.offlineOrders.update(item.id, { status: 'syncing' });
      }

      const res = await fetch(`${API_URL}/api/orders/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(item.payload),
      });

      if (res.ok) {
        // Remove successfully synced order from IndexedDB
        if (item.id) {
          await db.offlineOrders.delete(item.id);
        }
        syncedCount++;
      } else {
        // Revert status to pending on API failure
        if (item.id) {
          await db.offlineOrders.update(item.id, { status: 'pending' });
        }
        failedCount++;
      }
    } catch (err) {
      console.error('Dexie sync error for item', item.localUuid, err);
      if (item.id) {
        await db.offlineOrders.update(item.id, { status: 'pending' });
      }
      failedCount++;
      break; // Stop loop if network is unreachable
    }
  }

  return { synced: syncedCount, failed: failedCount };
}
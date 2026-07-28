import { db, LocalOrder, LocalOrderItem, LocalPayment, LocalDailyClosure } from './db';
import { sha256, formatFloat, generateUUID } from './crypto';

// ==========================================
// 1. Offline Menu Caching Helpers
// ==========================================

export async function cacheMenuLocally(categories: any[]): Promise<void> {
  await db.transaction('rw', [db.categories, db.products], async () => {
    await db.products.clear();
    await db.categories.clear();

    for (const cat of categories) {
      await db.categories.add({ id: cat.id, name: cat.name });

      const products = cat.products || cat.items || [];
      for (const prod of products) {
        await db.products.add({
          id: prod.id,
          category_id: cat.id,
          name: prod.name,
          price: parseFloat(prod.price || prod.unit_price || 0),
          vat_rate: parseFloat(prod.vat_rate || '10.00'),
          is_active: prod.is_active ? 1 : 0,
          category_name: cat.name,
          image: prod.image || null,
        });
      }
    }
  });
  console.log('✅ Menu cached in IndexedDB!');
}

export async function getLocalCachedProducts(): Promise<any[]> {
  if (typeof window === 'undefined') return [];
  return await db.products.where('is_active').equals(1).toArray();
}

// ======================================================
// 2. Offline Order Save & Cryptographic Chaining
// ======================================================

export async function getNextSequenceNumber(): Promise<number> {
  const count = await db.orders.count();
  return count + 1;
}

export async function getLastOrderHash(): Promise<string> {
  const lastOrder = await db.orders.orderBy('sequence_number').last();
  return (
    lastOrder?.hash ||
    '0000000000000000000000000000000000000000000000000000000000000000'
  );
}

export async function saveOrderLocallyToDexie(
  uuid: string,
  subtotalExclVat: number,
  vatAmount: number,
  totalInclVat: number,
  items: any[],
  paymentMethod: string,
  orderType: string = 'dine_in',
  customerName?: string,
  customerPhone?: string | null,
  splitDetails?: { cashAmount: number; cardAmount: number }
): Promise<number> {
  const sequenceNumber = await getNextSequenceNumber();
  const completedAt = new Date().toISOString().split('.')[0] + 'Z';
  const previousHash = await getLastOrderHash();

  const dataToHash = `${sequenceNumber}|${formatFloat(subtotalExclVat)}|${formatFloat(vatAmount)}|${formatFloat(totalInclVat)}|${completedAt}|${previousHash}`;
  const currentHash = await sha256(dataToHash);

  await db.transaction('rw', [db.orders, db.orderItems, db.payments], async () => {
    // 1. Save Core Order
    await db.orders.add({
      uuid,
      sequence_number: sequenceNumber,
      subtotal_excl_vat: subtotalExclVat,
      vat_amount: vatAmount,
      total_incl_vat: totalInclVat,
      hash: currentHash,
      previous_hash: previousHash,
      completed_at: completedAt,
      customer_name: customerName || 'Walk-in Customer',
      customer_phone: customerPhone || null,
      order_type: orderType,
      is_synced: 0,
      local_daily_closure_id: null,
    });

    // 2. Save Order Items
    for (const item of items) {
      const prod = item.product || item;
      const unitPrice = parseFloat(prod.price || item.unit_price || 0);
      const qty = item.quantity || 1;
      const vatRate = parseFloat(String(prod.vat_rate || item.vat_rate || '10.00'));

      await db.orderItems.add({
        order_uuid: uuid,
        product_id: prod.id || null,
        product_name: prod.name || item.product_name || 'Item',
        quantity: qty,
        unit_price: unitPrice,
        vat_rate: vatRate,
        subtotal: unitPrice * qty,
      });
    }

    // 3. Save Payments (Single or Split)
    if (paymentMethod === 'split' && splitDetails) {
      await db.payments.add({ order_uuid: uuid, amount: splitDetails.cashAmount, method: 'cash' });
      await db.payments.add({ order_uuid: uuid, amount: splitDetails.cardAmount, method: 'card' });
    } else {
      await db.payments.add({ order_uuid: uuid, amount: totalInclVat, method: paymentMethod });
    }
  });

  return sequenceNumber;
}

// ======================================================
// 3. 🚀 OFFLINE REFUNDS (Matching Expo Mobile)
// ======================================================

export async function refundOrderLocallyInDexie(
  originalUuid: string,
  totalInclVat: number,
  subtotalExclVat: number,
  vatAmount: number,
  paymentMethod: string
): Promise<number> {
  const refundUuid = generateUUID();
  const sequenceNumber = await getNextSequenceNumber();
  const completedAt = new Date().toISOString().split('.')[0] + 'Z';
  const previousHash = await getLastOrderHash();

  const dataToHash = `${sequenceNumber}|${formatFloat(-subtotalExclVat)}|${formatFloat(-vatAmount)}|${formatFloat(-totalInclVat)}|${completedAt}|${previousHash}`;
  const currentHash = await sha256(dataToHash);

  await db.transaction('rw', [db.orders, db.orderItems, db.payments], async () => {
    // 1. Insert Negative Order
    await db.orders.add({
      uuid: refundUuid,
      sequence_number: sequenceNumber,
      subtotal_excl_vat: -subtotalExclVat,
      vat_amount: -vatAmount,
      total_incl_vat: -totalInclVat,
      hash: currentHash,
      previous_hash: previousHash,
      completed_at: completedAt,
      is_synced: 0,
      local_daily_closure_id: null,
    });

    // 2. Fetch original items and insert negative items
    const originalItems = await db.orderItems.where('order_uuid').equals(originalUuid).toArray();
    for (const item of originalItems) {
      await db.orderItems.add({
        order_uuid: refundUuid,
        product_id: item.product_id,
        product_name: `REFUND: ${item.product_name}`,
        quantity: -item.quantity,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        subtotal: -(item.unit_price * item.quantity),
      });
    }

    // 3. Insert negative payment
    await db.payments.add({
      order_uuid: refundUuid,
      amount: -totalInclVat,
      method: paymentMethod,
    });
  });

  return sequenceNumber;
}

// ======================================================
// 4. 🚀 LOCAL DAILY Z-REPORT & ORDER FREEZING
// ======================================================

export async function getLocalOpenOrders(): Promise<LocalOrder[]> {
  if (typeof window === 'undefined') return [];
  return await db.orders.filter((o) => o.local_daily_closure_id === null || o.local_daily_closure_id === undefined).toArray();
}

export async function getLastZReportHash(): Promise<string> {
  const lastZ = await db.dailyClosures.orderBy('z_number').last();
  return (
    lastZ?.hash ||
    '0000000000000000000000000000000000000000000000000000000000000000'
  );
}

export async function getNextZNumber(): Promise<number> {
  const count = await db.dailyClosures.count();
  return count + 1;
}

/**
 * Compiles and freezes all unclosed orders inside IndexedDB,
 * generating daily sums and the cryptographic Z-Report hash chain!
 */
export async function closeDayLocallyInDexie(): Promise<{
  zNumber: number;
  totalTtc: number;
  totalHt: number;
  totalTva: number;
  hash: string;
}> {
  const openOrders = await getLocalOpenOrders();
  const nextZ = await getNextZNumber();
  const closedAt = new Date().toISOString().split('.')[0] + 'Z';

  let totalTtc = 0;
  let totalHt = 0;
  let totalTva = 0;

  openOrders.forEach((o) => {
    totalTtc += o.total_incl_vat;
    totalHt += o.subtotal_excl_vat;
    totalTva += o.vat_amount;
  });

  const previousHash = await getLastZReportHash();
  const dataToHash = `${nextZ}|${formatFloat(totalHt)}|${formatFloat(totalTva)}|${formatFloat(totalTtc)}|${closedAt}|${previousHash}`;
  const currentHash = await sha256(dataToHash);

  await db.transaction('rw', [db.dailyClosures, db.orders], async () => {
    // 1. Insert Z-Report Row
    const closureId = await db.dailyClosures.add({
      z_number: nextZ,
      total_ttc: totalTtc,
      total_ht: totalHt,
      total_tva: totalTva,
      hash: currentHash,
      previous_hash: previousHash,
      closed_at: closedAt,
      is_synced: 0,
    });

    // 2. 🛡️ FREEZE ORDERS: Link open orders to this closure ID
    const openOrderUuids = openOrders.map((o) => o.uuid);
    for (const uuid of openOrderUuids) {
      await db.orders.update(uuid, { local_daily_closure_id: Number(closureId) });
    }
  });

  return { zNumber: nextZ, totalTtc, totalHt, totalTva, hash: currentHash };
}

// ======================================================
// 5. 🚀 AUTOMATIC CLOUD SYNC ENGINE
// ======================================================

export async function getPendingOfflineOrdersCount(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  return await db.orders.where('is_synced').equals(0).count();
}

/**
 * Pushes unsynced IndexedDB orders to Laravel /api/orders/sync
 */
export async function syncOfflineOrdersFromDexie(
  accessToken: string | null
): Promise<{ synced: number; failed: number }> {
  const pendingOrders = await db.orders.where('is_synced').equals(0).toArray();
  if (pendingOrders.length === 0) return { synced: 0, failed: 0 };

  let syncedCount = 0;
  let failedCount = 0;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  for (const order of pendingOrders) {
    try {
      const items = await db.orderItems.where('order_uuid').equals(order.uuid).toArray();
      const payments = await db.payments.where('order_uuid').equals(order.uuid).toArray();

      const payload = {
        orders: [
          {
            uuid: order.uuid,
            sequence_number: order.sequence_number,
            subtotal_excl_vat: order.subtotal_excl_vat,
            vat_amount: order.vat_amount,
            total_incl_vat: order.total_incl_vat,
            completed_at: order.completed_at,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            order_type: order.order_type,
            hash: order.hash,
            previous_hash: order.previous_hash,
            items: items.map((i) => ({
              product_id: i.product_id,
              product_name: i.product_name,
              quantity: i.quantity,
              unit_price: i.unit_price,
              vat_rate: i.vat_rate,
              subtotal: i.subtotal,
            })),
            payments: payments.map((p) => ({
              amount: p.amount,
              method: p.method,
            })),
          },
        ],
      };

      const res = await fetch(`${API_URL}/api/orders/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await db.orders.update(order.uuid, { is_synced: 1 });
        syncedCount++;
      } else {
        failedCount++;
      }
    } catch (err) {
      console.error('Dexie sync exception:', err);
      failedCount++;
      break;
    }
  }

  return { synced: syncedCount, failed: failedCount };
}
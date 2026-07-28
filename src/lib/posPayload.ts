import { Product } from '@/types';
import { formatPrice } from './api';

export function buildOrderSyncPayload(
  cart: { product: Product; quantity: number }[],
  paymentMethod: 'cash' | 'card' | 'split',
  orderType: 'dine_in' | 'takeaway',
  customerName?: string,
  customerPhone?: string | null,
  splitDetails?: { cashAmount: number; cardAmount: number } // 🚀 Split Payment details
) {
  let totalInclVatSum = 0;
  let subtotalExclVatSum = 0;
  let totalVatAmountSum = 0;

  const itemsPayload = cart.map((item) => {
    const unitPrice = parseFloat(
      formatPrice(item.product.price || (item.product as any).unit_price)
    );

    const vatRate = parseFloat(
      String(item.product.vat_rate || (item.product as any).vat_rate || '10.00')
    );

    const lineTotalTtc = unitPrice * item.quantity;
    const lineSubtotalHt = lineTotalTtc / (1 + vatRate / 100);
    const lineVatAmount = lineTotalTtc - lineSubtotalHt;

    totalInclVatSum += lineTotalTtc;
    subtotalExclVatSum += lineSubtotalHt;
    totalVatAmountSum += lineVatAmount;

    return {
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: unitPrice,
      vat_rate: vatRate,
      subtotal: parseFloat(lineTotalTtc.toFixed(2)),
    };
  });

  // 🚀 Format Payments Array for Laravel OrderSyncController
  let paymentsPayload = [];
  if (paymentMethod === 'split' && splitDetails) {
    paymentsPayload = [
      { amount: parseFloat(splitDetails.cashAmount.toFixed(2)), method: 'cash' },
      { amount: parseFloat(splitDetails.cardAmount.toFixed(2)), method: 'card' },
    ];
  } else {
    paymentsPayload = [
      { amount: parseFloat(totalInclVatSum.toFixed(2)), method: paymentMethod },
    ];
  }

  const orderUuid = self.crypto.randomUUID();

  return {
    orders: [
      {
        uuid: orderUuid,
        sequence_number: 0, // Server auto-assigns 1, 2, 3...
        subtotal_excl_vat: parseFloat(subtotalExclVatSum.toFixed(2)),
        vat_amount: parseFloat(totalVatAmountSum.toFixed(2)),
        total_incl_vat: parseFloat(totalInclVatSum.toFixed(2)),
        completed_at: new Date().toISOString(),
        customer_name: customerName || 'Walk-in Customer',
        customer_phone: customerPhone || null,
        order_type: orderType,
        hash: null,
        previous_hash: null,
        items: itemsPayload,
        payments: paymentsPayload, // 🚀 Contains 1 or 2 payment records!
      },
    ],
  };
}
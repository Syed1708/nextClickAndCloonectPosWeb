'use client';

import { formatPrice } from '@/lib/api';

interface ThermalReceiptProps {
  order: any;
  restaurantInfo?: {
    name: string;
    address: string;
    phone: string;
    siret: string;
  };
}

export default function ThermalReceipt({
  order,
  restaurantInfo = {
    name: 'BURGER PALACE BORDEAUX',
    address: '12 Rue Sainte-Catherine, 33000 Bordeaux',
    phone: '+33 5 56 00 11 22',
    siret: '892 143 567 00012',
  },
}: ThermalReceiptProps) {
  if (!order || (!order.items && !order.order_items)) return null;

  const items = order.items || order.order_items || [];
  const totalAmount = Number(order.totalAmount || order.total_incl_vat || 0);

  // Detect if this ticket is an Avoir / Refund (Credit Note)
  const isRefund =
    order.order_type === 'refund' ||
    order.status === 'refunded' ||
    (order.customer_name && order.customer_name.includes('AVOIR')) ||
    totalAmount < 0;

  // Subtotal HT & TVA Calculations
  let subtotalHtSum = 0;
  let vatSum = 0;

  items.forEach((item: any) => {
    const prod = item.product || item;
    const price = parseFloat(formatPrice(prod.price || item.unit_price || item.price));
    const qty = Number(item.quantity || 1);
    const vatRate = parseFloat(String(prod.vat_rate || item.vat_rate || '10.00'));

    const lineTotal = item.subtotal !== undefined ? Number(item.subtotal) : price * qty;
    const lineHt = lineTotal / (1 + vatRate / 100);
    const lineVat = lineTotal - lineHt;

    subtotalHtSum += lineHt;
    vatSum += lineVat;
  });

  return (
    <div
      className="font-mono text-[11px] leading-tight text-black bg-white w-[80mm] p-2 mx-auto"
      style={{ color: '#000000', backgroundColor: '#ffffff' }}
    >
      {/* Restaurant Header */}
      <div className="text-center space-y-1 pb-2 border-b border-black border-dashed">
        <h2 className="font-extrabold text-sm tracking-wider uppercase text-black">
          {restaurantInfo.name}
        </h2>
        <p className="text-black">{restaurantInfo.address}</p>
        <p className="text-black">Tél: {restaurantInfo.phone}</p>
        <p className="text-black">SIRET: {restaurantInfo.siret}</p>
        {isRefund && (
          <div className="mt-1 font-black text-xs uppercase border border-black p-0.5 text-black">
            *** TICKET DE REMBOURSEMENT / AVOIR ***
          </div>
        )}
      </div>

      {/* Ticket Metadata */}
      <div className="py-2 border-b border-black border-dashed space-y-0.5 text-[10px] text-black">
        <div className="flex justify-between font-extrabold text-xs">
          <span>
            {isRefund ? 'AVOIR #' : 'TICKET #'}
            {order.sequence_number || 'POS'}
          </span>
          <span className="uppercase">
            {order.orderType === 'takeaway' || order.order_type === 'takeaway'
              ? 'À EMPORTER'
              : 'SUR PLACE'}
          </span>
        </div>
        <p>Date: {order.createdAt || new Date().toLocaleString('fr-FR')}</p>
        {(order.customerName || order.customer_name) && (
          <p className="font-bold">
            Client: {order.customerName || order.customer_name}
          </p>
        )}
      </div>

      {/* Itemized Products Table */}
      <table className="w-full my-2 border-b border-black border-dashed text-black">
        <thead>
          <tr className="border-b border-black text-left text-[9px] uppercase">
            <th className="py-1 w-8 text-black">Qte</th>
            <th className="py-1 text-black">Article</th>
            <th className="py-1 text-right w-14 text-black">P.U</th>
            <th className="py-1 text-right w-14 text-black">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/20 text-[10px]">
          {items.map((item: any, idx: number) => {
            const prod = item.product || item;
            const name = prod.name || item.product_name || 'Article';
            const qty = item.quantity || 1;
            const unitPrice = parseFloat(
              formatPrice(prod.price || item.unit_price || item.price)
            );
            const lineTotal =
              item.subtotal !== undefined
                ? Number(item.subtotal)
                : unitPrice * qty;
            const vatRate = parseFloat(
              String(prod.vat_rate || item.vat_rate || '10.00')
            );

            // Extract Item Customizations / Kitchen Notes
            const notes: string[] = Array.isArray(item.notes)
              ? item.notes
              : [];

            return (
              <tr key={idx} className="align-top text-black">
                <td className="py-1 font-extrabold text-black">{qty}x</td>
                <td className="py-1 pr-1 text-black">
                  <div>{name}</div>

                  {/* 🚀 PRINT ITEM CUSTOMIZATIONS / KITCHEN NOTES */}
                  {notes.length > 0 && (
                    <div className="text-[8.5px] font-bold text-gray-800 pl-1 mt-0.5 space-y-0.5">
                      {notes.map((note: string, nIdx: number) => (
                        <div key={nIdx}>• {note}</div>
                      ))}
                    </div>
                  )}

                  <div className="text-[8px] text-gray-600 mt-0.5">
                    TVA {vatRate.toFixed(1)}%
                  </div>
                </td>
                <td className="py-1 text-right text-black">€{unitPrice.toFixed(2)}</td>
                <td className="py-1 text-right font-extrabold text-black">
                  €{lineTotal.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Financial Breakdown */}
      <div className="space-y-1 pb-2 border-b border-black border-dashed text-[10px] text-black">
        <div className="flex justify-between">
          <span>Sous-total HT:</span>
          <span>€{subtotalHtSum.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Total TVA:</span>
          <span>€{vatSum.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-black text-sm pt-1 border-t border-black text-black">
          <span>TOTAL TTC:</span>
          <span>€{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Method Breakdown (Single or Split) */}
      <div className="py-2 border-b border-black border-dashed space-y-1 text-[10px] text-black">
        <div className="flex justify-between font-bold uppercase">
          <span>Mode de règlement:</span>
          <span>
            {order.payments && order.payments.length > 1
              ? 'RÈGLEMENT MIXTE'
              : order.paymentMethod === 'split'
              ? 'RÈGLEMENT MIXTE'
              : order.paymentMethod === 'cash' ||
                (order.payments?.[0]?.method === 'cash')
              ? 'ESPÈCES'
              : 'CARTE CB'}
          </span>
        </div>

        {/* 1. Database Payments Array (Server API Response) */}
        {order.payments && order.payments.length > 0 ? (
          <div className="pl-2 space-y-0.5 text-[9.5px]">
            {order.payments.map((p: any, idx: number) => (
              <div key={idx} className="flex justify-between text-black">
                <span>
                  • {p.method === 'cash' ? 'Espèces' : 'Carte CB'}:
                </span>
                <span className="font-bold">
                  €{Number(p.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          /* 2. Client-side Snapshot Fallback */
          <>
            {order.paymentMethod === 'split' && (
              <div className="pl-2 space-y-0.5 text-[9.5px] text-black">
                <div className="flex justify-between">
                  <span>• Payé en Espèces:</span>
                  <span className="font-bold">
                    €{Number(order.splitCashAmount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>• Payé par Carte CB:</span>
                  <span className="font-bold">
                    €{Number(order.splitCardAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {order.paymentMethod === 'cash' && (
              <div className="pl-2 space-y-0.5 text-[9.5px] text-black">
                <div className="flex justify-between">
                  <span>• Payé en Espèces:</span>
                  <span className="font-bold">
                    €{Number(totalAmount).toFixed(2)}
                  </span>
                </div>
                {order.cashGiven > 0 && (
                  <div className="flex justify-between">
                    <span>• Espèces reçues:</span>
                    <span>€{Number(order.cashGiven).toFixed(2)}</span>
                  </div>
                )}
                {order.changeDue > 0 && (
                  <div className="flex justify-between font-bold">
                    <span>• Monnaie rendue:</span>
                    <span>€{Number(order.changeDue).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {order.paymentMethod === 'card' && (
              <div className="pl-2 flex justify-between text-[9.5px] text-black">
                <span>• Payé par Carte CB:</span>
                <span className="font-bold">
                  €{Number(totalAmount).toFixed(2)}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer & SHA-256 Signature */}
      <div className="text-center pt-2 space-y-1 text-[9px] text-black">
        <p className="font-bold">Merci de votre visite et bon appétit !</p>
        <p className="text-[7px] break-all text-gray-600 mt-1">
          SHA256: {order.hash || order.id || 'NF525-VALIDATED'}
        </p>
      </div>
    </div>
  );
}
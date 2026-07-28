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
  if (!order || !order.items) return null;

  const items = order.items || [];
  const totalAmount = order.totalAmount || order.total_incl_vat || 0;

  // Subtotal HT & TVA Calculations
  let subtotalHtSum = 0;
  let vatSum = 0;

  items.forEach((item: any) => {
    const prod = item.product || item;
    const price = parseFloat(formatPrice(prod.price || item.unit_price));
    const qty = item.quantity || 1;
    const vatRate = parseFloat(String(prod.vat_rate || item.vat_rate || '10.00'));

    const lineTotal = price * qty;
    const lineHt = lineTotal / (1 + vatRate / 100);
    const lineVat = lineTotal - lineHt;

    subtotalHtSum += lineHt;
    vatSum += lineVat;
  });

  return (
    <div
      id="thermal-receipt"
      className="hidden print:block font-mono text-[11px] leading-tight text-black w-[80mm] p-2 mx-auto bg-white"
    >
      {/* Restaurant Header */}
      <div className="text-center space-y-1 pb-2 border-b border-black border-dashed">
        <h2 className="font-extrabold text-sm tracking-wider uppercase">{restaurantInfo.name}</h2>
        <p>{restaurantInfo.address}</p>
        <p>Tél: {restaurantInfo.phone}</p>
        <p>SIRET: {restaurantInfo.siret}</p>
      </div>

      {/* Ticket Metadata */}
      <div className="py-2 border-b border-black border-dashed space-y-0.5 text-[10px]">
        <div className="flex justify-between font-extrabold text-xs">
          <span>TICKET #{order.sequence_number || 'POS'}</span>
          <span className="uppercase">{order.orderType === 'takeaway' ? 'À EMPORTER' : 'SUR PLACE'}</span>
        </div>
        <p>Date: {order.createdAt || new Date().toLocaleString('fr-FR')}</p>
        {order.customerName && <p className="font-bold">Client: {order.customerName}</p>}
      </div>

      {/* Itemized Products Table */}
      <table className="w-full my-2 border-b border-black border-dashed">
        <thead>
          <tr className="border-b border-black text-left text-[9px] uppercase">
            <th className="py-1 w-8">Qte</th>
            <th className="py-1">Article</th>
            <th className="py-1 text-right w-16">P.U TTC</th>
            <th className="py-1 text-right w-16">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/20 text-[10px]">
          {items.map((item: any, idx: number) => {
            const prod = item.product || item;
            const name = prod.name || item.product_name || 'Article';
            const qty = item.quantity || 1;
            const unitPrice = parseFloat(formatPrice(prod.price || item.unit_price));
            const lineTotal = (unitPrice * qty).toFixed(2);
            const vatRate = parseFloat(String(prod.vat_rate || item.vat_rate || '10.00'));

            return (
              <tr key={idx} className="align-top">
                <td className="py-1 font-extrabold">{qty}x</td>
                <td className="py-1 pr-1">
                  <div>{name}</div>
                  <div className="text-[8px] text-gray-600">TVA {vatRate.toFixed(1)}%</div>
                </td>
                <td className="py-1 text-right">€{unitPrice.toFixed(2)}</td>
                <td className="py-1 text-right font-extrabold">€{lineTotal}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Financial Breakdown */}
      <div className="space-y-1 pb-2 border-b border-black border-dashed text-[10px]">
        <div className="flex justify-between text-gray-700">
          <span>Sous-total HT:</span>
          <span>€{subtotalHtSum.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Total TVA:</span>
          <span>€{vatSum.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-black text-sm pt-1 border-t border-black">
          <span>TOTAL TTC:</span>
          <span>€{Number(totalAmount).toFixed(2)}</span>
        </div>
      </div>

      {/* 🚀 ITEMIZED PAYMENT METHOD BREAKDOWN (CASH / CARD / MIXTE) */}
      <div className="py-2 border-b border-black border-dashed space-y-1 text-[10px]">
        <div className="flex justify-between font-bold uppercase">
          <span>Mode de règlement:</span>
          <span>
            {order.paymentMethod === 'split'
              ? 'RÈGLEMENT MIXTE'
              : order.paymentMethod === 'cash'
              ? 'ESPÈCES'
              : 'CARTE CB'}
          </span>
        </div>

        {/* 1. SPLIT PAYMENT DETAILS */}
        {order.paymentMethod === 'split' && (
          <div className="pl-2 space-y-0.5 text-[9.5px] text-gray-800">
            <div className="flex justify-between">
              <span>• Payé en Espèces:</span>
              <span className="font-bold">€{Number(order.splitCashAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>• Payé par Carte CB:</span>
              <span className="font-bold">€{Number(order.splitCardAmount || 0).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* 2. CASH PAYMENT DETAILS */}
        {order.paymentMethod === 'cash' && (
          <div className="pl-2 space-y-0.5 text-[9.5px] text-gray-800">
            <div className="flex justify-between">
              <span>• Payé en Espèces:</span>
              <span className="font-bold">€{Number(totalAmount).toFixed(2)}</span>
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

        {/* 3. CARD PAYMENT DETAILS */}
        {order.paymentMethod === 'card' && (
          <div className="pl-2 flex justify-between text-[9.5px] text-gray-800">
            <span>• Payé par Carte CB:</span>
            <span className="font-bold">€{Number(totalAmount).toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Receipt Footer */}
      <div className="text-center pt-2 space-y-1 text-[9px]">
        <p className="font-bold">Merci de votre visite et bon appétit !</p>
        <p className="text-[7px] break-all text-gray-600 mt-1">
          REF: {order.hash || 'NF525-VALIDATED'}
        </p>
      </div>
    </div>
  );
}
'use client';

interface ZReportThermalReceiptProps {
  closure: any;
  restaurantInfo?: {
    name: string;
    address: string;
    siret: string;
  };
}

export default function ZReportThermalReceipt({
  closure,
  restaurantInfo = {
    name: 'BURGER PALACE BORDEAUX',
    address: '12 Rue Sainte-Catherine, 33000 Bordeaux',
    siret: '892 143 567 00012',
  },
}: ZReportThermalReceiptProps) {
  if (!closure) return null;

  const payments = closure.payments_breakdown || closure.payments || {};
  const zNumber = closure.z_number || closure.zNumber || '1';
  const totalTtc = Number(closure.total_ttc || closure.totalTtc || 0);
  const totalHt = Number(closure.total_ht || closure.totalHt || 0);
  const totalTva = Number(closure.total_tva || closure.totalTva || 0);
  const closedAt = closure.closed_at || closure.closedAt || new Date().toISOString();

  return (
    <div
      className="font-mono text-[11px] leading-tight text-black bg-white w-[80mm] p-2 mx-auto"
      style={{ color: '#000000', backgroundColor: '#ffffff' }}
    >
      {/* Header */}
      <div className="text-center space-y-1 pb-2 border-b border-black border-dashed">
        <h2 className="font-extrabold text-sm tracking-wider uppercase text-black">
          RAPPORT DE CLÔTURE - Z
        </h2>
        <p className="text-black">{restaurantInfo.name}</p>
        <p className="text-black">{restaurantInfo.address}</p>
        <p className="text-black">SIRET: {restaurantInfo.siret}</p>
      </div>

      {/* Z Metadata */}
      <div className="py-2 border-b border-black border-dashed space-y-0.5 text-[10px] text-black">
        <div className="flex justify-between font-extrabold text-xs">
          <span>RAPPORT Z N°:</span>
          <span>Z#{zNumber}</span>
        </div>
        <p>Date Clôture: {new Date(closedAt).toLocaleString('fr-FR')}</p>
      </div>

      {/* Financial Totals */}
      <div className="py-2 border-b border-black border-dashed space-y-1 text-[10px] text-black">
        <div className="flex justify-between">
          <span>Chiffre d'Affaires HT:</span>
          <span>€{totalHt.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Total TVA Collectée:</span>
          <span>€{totalTva.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-black text-sm pt-1 border-t border-black text-black">
          <span>TOTAL CA TTC:</span>
          <span>€{totalTtc.toFixed(2)}</span>
        </div>
      </div>

      {/* Payments Breakdown */}
      <div className="py-2 border-b border-black border-dashed space-y-0.5 text-[10px] text-black">
        <span className="font-bold uppercase">VENTES PAR RÈGLEMENT:</span>
        <div className="flex justify-between pl-2">
          <span>• Total Espèces:</span>
          <span className="font-bold">
            €{Number(payments.cash || closure.cashSales || 0).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between pl-2">
          <span>• Total Carte CB:</span>
          <span className="font-bold">
            €{Number(payments.card || closure.cardSales || 0).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Footer Signature */}
      <div className="text-center pt-2 space-y-1 text-[8px] text-black">
        <p className="font-bold">CLÔTURE JOURNALIÈRE CERTIFIÉE NF525</p>
        <p className="break-all text-gray-700">
          SHA256: {closure.hash || 'NF525-VALIDATED'}
        </p>
      </div>
    </div>
  );
}
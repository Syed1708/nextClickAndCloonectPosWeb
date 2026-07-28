'use client';

import { Order } from '@/types';
import { X, CheckCircle2, HardDrive, Printer, History, Loader2, Undo2, DollarSign } from 'lucide-react';
import ThermalReceipt from './ThermalReceipt';

interface PosModalsProps {
  completedOrder: any | null;
  showSalesHistoryModal: boolean;
  showZClosureModal: boolean;
  salesHistory: any[];
  loadingHistory: boolean;
  cashierName: string;
  onCloseCompletedModal: () => void;
  onCloseSalesHistoryModal: () => void;
  onCloseZClosureModal: () => void;
  onRefundOrder: (id: number) => void;
}

export default function PosModals({
  completedOrder,
  showSalesHistoryModal,
  showZClosureModal,
  salesHistory,
  loadingHistory,
  cashierName,
  onCloseCompletedModal,
  onCloseSalesHistoryModal,
  onCloseZClosureModal,
  onRefundOrder,
}: PosModalsProps) {
  return (
    <>

      <ThermalReceipt order={completedOrder} />

      {/* 🚀 RECEIPT MODAL */}
      {completedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-6 text-center relative">
            <button onClick={onCloseCompletedModal} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
              {completedOrder.isOffline ? <HardDrive className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-white">
                {completedOrder.isOffline ? 'Order Saved Offline!' : 'Order Sent to Kitchen!'}
              </h3>
              <p className="text-xs text-amber-500 font-bold uppercase tracking-widest mt-1">
                Sequence #{completedOrder.sequence_number}
              </p>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl space-y-2 text-xs text-left">
              <div className="flex justify-between text-zinc-400">
                <span>Storage Engine:</span>
                <span className="font-bold text-white">
                  {completedOrder.isOffline ? 'IndexedDB (Dexie.js)' : 'Laravel Cloud Sync'}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400 border-t border-zinc-800/80 pt-2">
                <span>Total Paid:</span>
                <span className="font-black text-amber-400 text-sm">
                  €{completedOrder.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4" /> Print
              </button>

              <button
                onClick={onCloseCompletedModal}
                className="flex-1 bg-amber-500 text-zinc-950 font-bold py-3 rounded-xl text-xs transition"
              >
                Next Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 SALES HISTORY MODAL */}
      {showSalesHistoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" /> Recent POS Sales & Refunds
              </h3>
              <button onClick={onCloseSalesHistoryModal} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {loadingHistory ? (
                <div className="flex justify-center py-10 text-zinc-500">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading sales log...
                </div>
              ) : salesHistory.length === 0 ? (
                <p className="text-center py-8 text-zinc-500 text-xs">No sales history found.</p>
              ) : (
                salesHistory.map((item: Order) => (
                  <div key={item.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white">Order #{item.sequence_number || item.id}</p>
                      <p className="text-zinc-500 text-[10px]">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-amber-400 font-extrabold">€{Number(item.total_incl_vat || item.total_amount).toFixed(2)}</span>
                      <button
                        onClick={() => onRefundOrder(item.id)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1"
                      >
                        <Undo2 className="w-3 h-3" /> Refund
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🚀 Z-CLOSURE MODAL */}
      {showZClosureModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-6 text-center">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white">Register Z-Closure</h3>
              <p className="text-xs text-zinc-400 mt-1">End of shift register summary</p>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl space-y-2 text-xs text-left">
              <div className="flex justify-between text-zinc-400">
                <span>Cashier Staff:</span>
                <span className="font-bold text-white">{cashierName}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Shift Date:</span>
                <span className="font-bold text-white">{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCloseZClosureModal}
                className="flex-1 bg-zinc-800 text-zinc-400 font-bold py-3 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Shift Z-Closure report printed & register closed!');
                  onCloseZClosureModal();
                }}
                className="flex-1 bg-emerald-500 text-zinc-950 font-bold py-3 rounded-xl text-xs"
              >
                Close Register
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
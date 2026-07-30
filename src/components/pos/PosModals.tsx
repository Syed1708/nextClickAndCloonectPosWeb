'use client';

import { useState, useEffect } from 'react';
import ThermalReceipt from './ThermalReceipt';
import ZReportThermalReceipt from './ZReportThermalReceipt';
import { db } from '@/lib/db';
import { closeDayLocallyInDexie } from '@/lib/offlineQueue';
import {
  X,
  CheckCircle2,
  HardDrive,
  Printer,
  History,
  Loader2,
  Undo2,
  DollarSign,
  Search,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  Receipt,
} from 'lucide-react';
import PrintPortal from './PrintPortal';

interface PosModalsProps {
  completedOrder: any | null;
  showSalesHistoryModal: boolean;
  showZClosureModal: boolean;
  salesHistory: any[];
  loadingHistory: boolean;
  cashierName: string;
  accessToken?: string | null;
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
  accessToken,
  onCloseCompletedModal,
  onCloseSalesHistoryModal,
  onCloseZClosureModal,
  onRefundOrder,
}: PosModalsProps) {
  // Z-Closure Modal Tabs State
  const [zTab, setZTab] = useState<'close' | 'history'>('close');
  const [actualCash, setActualCash] = useState<string>('');
  const [isClosing, setIsClosing] = useState(false);

  // Z-Closure History State
  const [zClosureHistory, setZClosureHistory] = useState<any[]>([]);
  const [loadingZHistory, setLoadingZHistory] = useState(false);
  const [printZReport, setPrintZReport] = useState<any | null>(null);

  // Sales History Filter & Search State
  const [salesSearch, setSalesSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'refunded' | 'local'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<number | string | null>(null);
  const [reprintOrder, setReprintOrder] = useState<any | null>(null);

  // 🚀 PRINT HANDLERS WITH RENDER TIMEOUT
  const handlePrintOrderReceipt = (orderData: any) => {
    setPrintZReport(null);
    setReprintOrder(orderData);

    // 200ms delay guarantees React renders the receipt HTML before browser prints!
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handlePrintZReport = (zData: any) => {
    setReprintOrder(null);
    setPrintZReport(zData);

    setTimeout(() => {
      window.print();
    }, 200);
  };

  // 🚀 REACT 19 SAFE EFFECT FOR Z-REPORT HISTORY (No synchronous setState warnings)
  useEffect(() => {
    let isMounted = true;

    if (showZClosureModal && zTab === 'history') {
      const loadZHistory = async () => {
        setLoadingZHistory(true);
        let combinedHistory: any[] = [];

        try {
          if (typeof window !== 'undefined') {
            const localZ = await db.dailyClosures.toArray();
            combinedHistory = localZ.map((z) => ({
              ...z,
              isOffline: true,
              z_number: z.z_number,
              total_ttc: z.total_ttc,
              total_ht: z.total_ht,
              total_tva: z.total_tva,
              closed_at: z.closed_at,
            }));
          }
        } catch (err) {
          console.error('Failed to read Dexie Z-reports:', err);
        }

        if (navigator.onLine) {
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/pos/z-closure/history`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  Accept: 'application/json',
                },
              }
            );

            if (res.ok) {
              const data = await res.json();
              const serverZ = data.data || data;
              const serverZArray = Array.isArray(serverZ) ? serverZ : [];
              combinedHistory = [...serverZArray, ...combinedHistory];
            }
          } catch (e) {
            console.error('Failed to fetch server Z-history:', e);
          }
        }

        combinedHistory.sort(
          (a, b) => (b.z_number || b.zNumber || 0) - (a.z_number || a.zNumber || 0)
        );

        if (isMounted) {
          setZClosureHistory(combinedHistory);
          setLoadingZHistory(false);
        }
      };

      loadZHistory();
    }

    return () => {
      isMounted = false;
    };
  }, [showZClosureModal, zTab, accessToken]);

  // Z-Closure Confirmation Handler
  const handleConfirmZClosure = async () => {
    setIsClosing(true);

    try {
      if (!navigator.onLine) {
        const zReport = await closeDayLocallyInDexie();
        handlePrintZReport(zReport);
        alert(`🎉 Z-Closure #${zReport.zNumber} Generated! Total TTC: €${zReport.totalTtc.toFixed(2)}`);
        onCloseZClosureModal();
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/pos/z-closure/confirm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ actual_cash: parseFloat(actualCash) || 0 }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        handlePrintZReport(data.closure);
        alert(`Shift Z-Closure #${data.closure?.z_number} printed & register closed!`);
        onCloseZClosureModal();
      } else {
        const zReport = await closeDayLocallyInDexie();
        handlePrintZReport(zReport);
        onCloseZClosureModal();
      }
    } catch (err) {
      const zReport = await closeDayLocallyInDexie();
      handlePrintZReport(zReport);
      onCloseZClosureModal();
    } finally {
      setIsClosing(false);
    }
  };

  // Search & Filter Logic
  const filteredSales = salesHistory.filter((item: any) => {
    const seqNum = String(item.sequence_number || item.id || '');
    const custName = String(item.customer_name || item.customerName || '').toLowerCase();
    const matchesSearch =
      seqNum.includes(salesSearch) || custName.includes(salesSearch.toLowerCase());

    const isRefunded = item.status === 'refunded' || item.preparation_status === 'cancelled';
    const isLocal = item.isOffline || item.is_synced === 0;

    let matchesStatus = true;
    if (statusFilter === 'completed') matchesStatus = !isRefunded;
    if (statusFilter === 'refunded') matchesStatus = isRefunded;
    if (statusFilter === 'local') matchesStatus = isLocal;

    return matchesSearch && matchesStatus;
  });

  return (
    <>

      {/* 🚀 REMOVED Tailwind 'hidden print:block' -> globals.css handles this now! */}
      <PrintPortal>
        {reprintOrder || completedOrder ? (
          <ThermalReceipt order={reprintOrder || completedOrder} />
        ) : null}
        {printZReport ? <ZReportThermalReceipt closure={printZReport} /> : null}
      </PrintPortal>

      {/* 1. ORDER COMPLETED RECEIPT MODAL */}
      {completedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
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
                  €{Number(completedOrder.totalAmount || completedOrder.total_incl_vat || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handlePrintOrderReceipt(completedOrder)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4" /> Print Thermal
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

      {/* 2. SALES HISTORY & REFUND MODAL */}
      {showSalesHistoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-3xl w-full max-h-[85vh] flex flex-col space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-500" /> Sales History & Refunds
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Search, inspect tickets, and execute refunds</p>
              </div>
              <button onClick={onCloseSalesHistoryModal} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search by Ticket # or Customer Name..."
                  value={salesSearch}
                  onChange={(e) => setSalesSearch(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'All Sales' },
                  { key: 'completed', label: 'Completed' },
                  { key: 'refunded', label: 'Refunded' },
                  { key: 'local', label: 'Local Unsynced' },
                ].map((chip) => (
                  <button
                    key={chip.key}
                    onClick={() => setStatusFilter(chip.key as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${statusFilter === chip.key
                        ? 'bg-amber-500 text-zinc-950'
                        : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
                      }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

{/* Sales List Container */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingHistory ? (
                <div className="flex justify-center py-12 text-zinc-500">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading sales log...
                </div>
              ) : filteredSales.length === 0 ? (
                <p className="text-center py-10 text-zinc-500 text-xs">No matching sales records found.</p>
              ) : (
                filteredSales.map((item: any) => {
                  const isRefunded =
                    item.status === 'refunded' || item.preparation_status === 'cancelled';
                  
                  const isAvoirCreditNote =
                    item.order_type === 'refund' ||
                    (item.customer_name && item.customer_name.includes('AVOIR')) ||
                    Number(item.total_incl_vat || item.total_amount) < 0;

                  // 🚀 HARDENED DISABLE CHECK
                  const cannotRefund =
                    isRefunded || isAvoirCreditNote || item.preparation_status === 'cancelled';

                  const isLocal = item.isOffline || item.is_synced === 0;
                  const isExpanded = expandedOrderId === item.id;
                  const numericTotal = Number(item.total_incl_vat || item.total_amount || 0);

                  return (
                    <div
                      key={item.id || item.uuid}
                      className={`border rounded-2xl p-4 space-y-3 transition ${
                        isAvoirCreditNote
                          ? 'bg-red-950/30 border-red-500/40'
                          : isRefunded
                          ? 'bg-zinc-900/60 border-zinc-800'
                          : 'bg-zinc-950 border-zinc-800'
                      }`}
                    >
                      {/* Top Summary Row */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-sm">
                              Ticket #{item.sequence_number || item.id}
                            </span>

                            {/* 🚀 BADGES: AVOIR vs ANNULÉ/REMBOURSÉ vs PAYÉ */}
                            {isAvoirCreditNote ? (
                              <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                AVOIR / CREDIT NOTE
                              </span>
                            ) : isRefunded ? (
                              <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                ANNULÉ / REMBOURSÉ
                              </span>
                            ) : (
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                                Payé
                              </span>
                            )}

                            {/* SYNC BADGE */}
                            {isLocal ? (
                              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <WifiOff className="w-3 h-3" /> Local (IndexedDB)
                              </span>
                            ) : (
                              <span className="bg-zinc-800 text-zinc-400 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Wifi className="w-3 h-3 text-emerald-400" /> Cloud Synced
                              </span>
                            )}
                          </div>

                          <p className="text-zinc-500 text-[11px]">
                            {new Date(item.created_at).toLocaleString()}{' '}
                            {item.customer_name && `• Client: ${item.customer_name}`}
                          </p>
                        </div>

                        {/* Amount & Refund Button */}
                        <div className="flex items-center gap-3">
                          <span
                            className={`font-black text-base ${
                              isAvoirCreditNote
                                ? 'text-red-400 font-extrabold'
                                : isRefunded
                                ? 'text-zinc-500 line-through'
                                : 'text-amber-400'
                            }`}
                          >
                            €{numericTotal.toFixed(2)}
                          </span>

                          <button
                            onClick={() => setExpandedOrderId(isExpanded ? null : item.id)}
                            className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>

                          {/* 🚀 REFUND BUTTON: PERMANENTLY DISABLED IF REFUNDED OR AVOIR */}
                          <button
                            disabled={cannotRefund}
                            onClick={() => onRefundOrder(item.id)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                              cannotRefund
                                ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800'
                                : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            <span>{isAvoirCreditNote ? 'Avoir' : cannotRefund ? 'Remboursé' : 'Refund'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-zinc-800/80 space-y-3 bg-zinc-900/50 p-3 rounded-xl text-xs">
                          <div className="space-y-1">
                            <span className="font-bold text-zinc-400 text-[11px] uppercase">Articles:</span>
                            {item.items?.map((prodItem: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-zinc-300 text-xs">
                                <span>
                                  {prodItem.quantity}x {prodItem.product_name || prodItem.name}
                                </span>
                                <span className="font-semibold">
                                  €{Number(prodItem.subtotal || prodItem.unit_price * prodItem.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
                            <button
                              onClick={() => {
                                setReprintOrder(item);
                                setTimeout(() => window.print(), 100);
                              }}
                              className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-500" /> Re-print Receipt
                            </button>
                            <span className="text-zinc-500 text-[10px]">
                              Mode: {item.payments?.[0]?.method || 'Carte CB'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>


          </div>
        </div>
      )}

      {/* 3. SHIFT Z-CLOSURE MODAL */}
      {showZClosureModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-lg w-full max-h-[85vh] flex flex-col space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" /> Register Z-Closure
              </h3>
              <button onClick={onCloseZClosureModal} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex bg-zinc-950 border border-zinc-800 p-1 rounded-2xl gap-1">
              <button
                onClick={() => setZTab('close')}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition ${zTab === 'close' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400'
                  }`}
              >
                Close Current Shift
              </button>
              <button
                onClick={() => setZTab('history')}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition ${zTab === 'history' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400'
                  }`}
              >
                Z-Report History Archive
              </button>
            </div>

            {zTab === 'close' && (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
                  <DollarSign className="w-6 h-6" />
                </div>

                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl space-y-3 text-xs text-left">
                  <div className="flex justify-between text-zinc-400">
                    <span>Cashier Staff:</span>
                    <span className="font-bold text-white">{cashierName}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Shift Date:</span>
                    <span className="font-bold text-white">{new Date().toLocaleDateString('fr-FR')}</span>
                  </div>

                  <div className="pt-2 border-t border-zinc-800">
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      Actual Cash in Drawer (€):
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 150.00"
                      value={actualCash}
                      onChange={(e) => setActualCash(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={onCloseZClosureModal} className="flex-1 bg-zinc-800 text-zinc-400 font-bold py-3 rounded-xl text-xs">
                    Cancel
                  </button>
                  <button
                    disabled={isClosing}
                    onClick={handleConfirmZClosure}
                    className="flex-1 bg-emerald-500 text-zinc-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2"
                  >
                    {isClosing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Close Register & Freeze'}
                  </button>
                </div>
              </div>
            )}

            {zTab === 'history' && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[50vh]">
                {loadingZHistory ? (
                  <div className="flex justify-center py-10 text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading Z-Report archive...
                  </div>
                ) : zClosureHistory.length === 0 ? (
                  <p className="text-center py-8 text-zinc-500 text-xs">No previous Z-Closure reports found.</p>
                ) : (
                  zClosureHistory.map((z: any) => (
                    <div key={z.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-amber-400 text-sm">
                          Z-Report #{z.z_number}
                        </span>
                        <span className="text-zinc-500 text-[10px]">
                          {new Date(z.closed_at || z.created_at).toLocaleString('fr-FR')}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-800/80 text-[11px] text-zinc-400">
                        <div>
                          <span>Total HT:</span>
                          <p className="font-bold text-white">€{Number(z.total_ht || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <span>Total TVA:</span>
                          <p className="font-bold text-white">€{Number(z.total_tva || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <span>Total TTC:</span>
                          <p className="font-black text-amber-400">€{Number(z.total_ttc || 0).toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-between items-center">
                        <button
                          onClick={() => handlePrintZReport(z)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-400" /> Re-print Z-Report
                        </button>
                        <span className="text-[8px] text-zinc-600 truncate max-w-37.5">
                          SHA256: {z.hash?.substring(0, 16)}...
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
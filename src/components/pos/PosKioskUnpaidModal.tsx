'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Banknote,
  X,
  Loader2,
  Receipt,
  Trash2,
} from 'lucide-react';

interface PosKioskUnpaidModalProps {
  accessToken: string | null;
  onClose: () => void;
  onOrderPaid: () => void;
}

export default function PosKioskUnpaidModal({
  accessToken,
  onClose,
  onOrderPaid,
}: PosKioskUnpaidModalProps) {
  const [unpaidOrders, setUnpaidOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  
  // 🚀 FIX 1: Default loading to true
  const [loading, setLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  // 🚀 FIX 2: Refetch helper for manual user actions (collect/void buttons)
  const refetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/pos/kiosk-unpaid-orders`, {
        headers: {
          'Accept': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUnpaidOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch unpaid kiosk orders', err);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 FIX 3: Pure Asynchronous Effect (Zero Synchronous setState Calls in Body)
  useEffect(() => {
    let isCancelled = false;

    async function loadUnpaidOrders() {
      try {
        const res = await fetch(`${API_BASE}/api/pos/kiosk-unpaid-orders`, {
          headers: {
            'Accept': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setUnpaidOrders(Array.isArray(data) ? data : []);
          }
        }
      } catch (err) {
        console.error('Failed to fetch unpaid kiosk orders:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false); // Called asynchronously after fetch completes
        }
      }
    }

    loadUnpaidOrders();

    return () => {
      isCancelled = true;
    };
  }, [API_BASE, accessToken]);

  // Cashier collects payment
  const handleCollectPayment = async (paymentMethod: 'cash' | 'card') => {
    if (!selectedOrder || isProcessing) return;
    setIsProcessing(true);

    try {
      const res = await fetch(`${API_BASE}/api/pos/kiosk-orders/${selectedOrder.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ payment_method: paymentMethod }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSelectedOrder(null);
        await refetchOrders();
        onOrderPaid();
      } else {
        alert(data.message || 'Failed to collect payment.');
      }
    } catch (err) {
      alert('Error collecting payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Void / Cancel Abandoned Kiosk Order
  const handleCancelKioskOrder = async () => {
    if (!selectedOrder || isProcessing) return;
    if (!confirm(`Are you sure you want to void Ticket #${selectedOrder.sequence_number || selectedOrder.id}? This will restore stock levels.`)) return;

    setIsProcessing(true);

    try {
      const res = await fetch(`${API_BASE}/api/pos/kiosk-orders/${selectedOrder.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSelectedOrder(null);
        await refetchOrders();
        onOrderPaid();
      } else {
        alert(data.message || 'Failed to cancel kiosk order.');
      }
    } catch (err) {
      alert('Error cancelling kiosk order.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-2xl w-full space-y-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-500" /> Pending Kiosk Counter Payments
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Collect payment or void abandoned kiosk orders</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[300px]">
          {/* Unpaid Orders Queue */}
          <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
            {loading ? (
              <div className="py-12 text-center text-zinc-500 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                <span className="text-xs">Loading pending kiosk tickets...</span>
              </div>
            ) : unpaidOrders.length === 0 ? (
              <p className="text-center py-12 text-zinc-500 text-xs font-bold">
                ✓ No pending counter payments at the moment.
              </p>
            ) : (
              unpaidOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-4 rounded-2xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-white ring-2 ring-amber-500/20'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-base text-white">Ticket #{order.sequence_number || order.id}</strong>
                        <p className="text-xs text-zinc-400">{order.customer_name || 'Kiosk Customer'}</p>
                      </div>
                      <span className="text-amber-400 font-black text-base">
                        €{parseFloat(order.total_incl_vat).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-2 pt-2 border-t border-zinc-900">
                      <span>{order.items?.length || 0} Items</span>
                      <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Payment / Void Action Panel */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
            {selectedOrder ? (
              <>
                <div className="space-y-4">
                  <div className="border-b border-zinc-800 pb-3 flex justify-between items-start">
                    <div>
                      <span className="text-xs text-amber-400 font-bold uppercase">Ticket Selected</span>
                      <h4 className="text-xl font-black text-white"># {selectedOrder.sequence_number || selectedOrder.id}</h4>
                      <p className="text-xs text-zinc-400">Customer: {selectedOrder.customer_name}</p>
                    </div>

                    <button
                      disabled={isProcessing}
                      onClick={handleCancelKioskOrder}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                      title="Void Abandoned Ticket"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Void
                    </button>
                  </div>

                  {/* Item List Preview */}
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1 text-xs">
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-zinc-300">
                        <span>{item.quantity}x {item.product_name}</span>
                        <span className="text-zinc-400">€{parseFloat(item.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-sm font-black">
                    <span>Total Due</span>
                    <span className="text-amber-400 text-lg">€{parseFloat(selectedOrder.total_incl_vat).toFixed(2)}</span>
                  </div>
                </div>

                {/* Collect Buttons */}
                <div className="space-y-2 pt-3">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block text-center">Collect Payment</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      disabled={isProcessing}
                      onClick={() => handleCollectPayment('cash')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Banknote className="w-4 h-4" /> Cash
                    </button>

                    <button
                      disabled={isProcessing}
                      onClick={() => handleCollectPayment('card')}
                      className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <CreditCard className="w-4 h-4" /> Card
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-zinc-500 space-y-2">
                <Receipt className="w-8 h-8 mx-auto text-zinc-700" />
                <p className="text-xs font-bold">Select a ticket on the left to process or void.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
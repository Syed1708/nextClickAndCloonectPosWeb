'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '../../types';
import { getImageUrl, formatPrice } from '../../lib/api';
import {
  saveOfflineOrderToDexie,
  getPendingOfflineOrdersCount,
  syncOfflineOrdersFromDexie,
} from '../../lib/offlineQueue';
import {
  Plus,
  Minus,
  Search,
  CreditCard,
  Banknote,
  UtensilsCrossed,
  ShoppingBag,
  Printer,
  RotateCcw,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  X,
  Wifi,
  WifiOff,
  RefreshCw,
  HardDrive,
} from 'lucide-react';
import { Order } from '@/app/types';

interface PosCartItem {
  product: Product;
  quantity: number;
}

interface PosClientShellProps {
  initialProducts: Product[];
  cashierName: string;
  accessToken: string | null;
}

type OrderType = 'dine_in' | 'takeaway';
type PaymentMethod = 'cash' | 'card';

export default function PosClientShell({
  initialProducts,
  cashierName,
  accessToken,
}: PosClientShellProps) {
  const [products] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Register State
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cashGiven, setCashGiven] = useState<string>('');

  // 🚀 DEXIE INDEXEDDB & AUTO-SYNC STATE
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Processing & Receipt Modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  // Update Dexie Queue Count
  const updatePendingCount = useCallback(async () => {
    const count = await getPendingOfflineOrdersCount();
    setPendingSyncCount(count);
  }, []);

  // 🚀 SILENT AUTO-SYNC ENGINE
  const triggerAutoSync = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;
    setIsSyncing(true);

    try {
      const result = await syncOfflineOrdersFromDexie(accessToken);
      await updatePendingCount();

      if (result.synced > 0) {
        console.log(`[Dexie Sync] Successfully uploaded ${result.synced} ticket(s) to server.`);
      }
    } catch (e) {
      console.error('[Dexie Sync Error]:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [accessToken, isSyncing, updatePendingCount]);

  // 🚀 60-SECOND BACKGROUND TIMER & NETWORK LISTENERS
  useEffect(() => {
    updatePendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      triggerAutoSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 🚀 Silent timer running every 60 seconds (60000 ms)
    const autoSyncInterval = setInterval(() => {
      if (navigator.onLine) {
        triggerAutoSync();
      }
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(autoSyncInterval);
    };
  }, [triggerAutoSync, updatePendingCount]);

  const categories = [
    'All',
    ...Array.from(new Set(products.map((p) => p.category_name || 'Burgers'))),
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || (product.category_name || 'Burgers') === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setCart([]);
    setCashGiven('');
  };

  const totalAmount = cart.reduce((sum, item) => {
    const priceVal = parseFloat(formatPrice(item.product.price || (item.product as Product).unit_price));
    return sum + priceVal * item.quantity;
  }, 0);

  const totalItemsCount = cart.reduce((a, c) => a + c.quantity, 0);
  const cashGivenNum = parseFloat(cashGiven) || 0;
  const changeDue = Math.max(0, cashGivenNum - totalAmount);

  // 🚀 LOCAL THERMAL PRINT BRIDGE (Connects to Node/Python ESC/POS service on port 9100)
  const printThermalReceipt = async (orderData: Order) => {
    try {
      await fetch('http://localhost:9100/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
    } catch (e) {
      // Fallback to browser print dialog if local bridge is not running
      window.print();
    }
  };

  // 🚀 INDEXEDDB OFFLINE-FIRST CHARGE ORDER FLOW
  const handleChargeOrder = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'cash' && cashGivenNum < totalAmount) {
      alert('Cash received is less than total amount!');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      order_type: orderType,
      payment_method: paymentMethod,
      cash_given: paymentMethod === 'cash' ? cashGivenNum : totalAmount,
      change_due: paymentMethod === 'cash' ? changeDue : 0,
      total_amount: totalAmount,
      items: cart.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: parseFloat(formatPrice(item.product.price || (item.product as Product).unit_price)),
      })),
    };

    // If offline, save directly into IndexedDB (Dexie.js)
    if (!navigator.onLine) {
      const offlineRecord = await saveOfflineOrderToDexie(payload);
      await updatePendingCount();

      setCompletedOrder({
        id: offlineRecord.localUuid,
        sequence_number: 'LOCAL-DEXIE',
        items: cart,
        totalAmount,
        paymentMethod,
        cashGiven: cashGivenNum,
        changeDue,
        orderType,
        isOffline: true,
        createdAt: new Date().toLocaleTimeString(),
      });

      clearCart();
      setIsSubmitting(false);
      return;
    }

    // Try online sync with server
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/orders/sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setCompletedOrder({
          id: data.order_id || data.order?.id,
          sequence_number: data.sequence_number || data.order?.sequence_number || 'POS-1',
          items: cart,
          totalAmount,
          paymentMethod,
          cashGiven: cashGivenNum,
          changeDue,
          orderType,
          isOffline: false,
          createdAt: new Date().toLocaleTimeString(),
        });

        clearCart();
      } else {
        // Fallback to IndexedDB
        await saveOfflineOrderToDexie(payload);
        await updatePendingCount();
        alert('Server unreachable. Ticket saved to IndexedDB!');
        clearCart();
      }
    } catch (err) {
      // Fallback to IndexedDB on network drop
      const offlineRecord = await saveOfflineOrderToDexie(payload);
      await updatePendingCount();

      setCompletedOrder({
        id: offlineRecord.localUuid,
        sequence_number: 'LOCAL-DEXIE',
        items: cart,
        totalAmount,
        paymentMethod,
        cashGiven: cashGivenNum,
        changeDue,
        orderType,
        isOffline: true,
        createdAt: new Date().toLocaleTimeString(),
      });

      clearCart();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-zinc-950 text-white flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              Headless Web POS
            </h1>
            <p className="text-xs text-zinc-400">{cashierName}</p>
          </div>
        </div>

        {/* Status Indicators & Sync Controls */}
        <div className="flex items-center gap-3">
          {isOnline ? (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-bold">
              <Wifi className="w-3.5 h-3.5" />
              <span>Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline (Dexie.js)</span>
            </div>
          )}

          {/* Unsynced IndexedDB Orders Badge */}
          {pendingSyncCount > 0 && (
            <button
              onClick={triggerAutoSync}
              disabled={isSyncing || !isOnline}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-3 py-1.5 rounded-xl text-xs font-black transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync {pendingSyncCount} Ticket(s)</span>
            </button>
          )}

          {/* Order Type Toggle */}
          <div className="hidden sm:flex bg-zinc-950 border border-zinc-800 p-1 rounded-2xl gap-1">
            <button
              onClick={() => setOrderType('dine_in')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                orderType === 'dine_in'
                  ? 'bg-amber-500 text-zinc-950'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" /> Sur Place
            </button>
            <button
              onClick={() => setOrderType('takeaway')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                orderType === 'takeaway'
                  ? 'bg-amber-500 text-zinc-950'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> À Emporter
            </button>
          </div>
        </div>
      </header>

      {/* Main Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Product Selection Grid */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden space-y-4">
          <div className="space-y-3 shrink-0">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Fast search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-white"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 auto-rows-max">
            {filteredProducts.map((product) => {
              const price = formatPrice(product.price || (product as Product).unit_price);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 active:scale-95 transition rounded-2xl p-3 flex flex-col justify-between text-left group h-36 relative overflow-hidden"
                >
                  <div className="relative w-full h-16 rounded-xl bg-zinc-800 overflow-hidden mb-2">
                    <Image
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-white truncate">{product.name}</h3>
                    <p className="text-amber-400 font-black text-sm">€{price}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Register Ticket */}
        <aside className="w-80 sm:w-96 md:w-105 bg-zinc-900 border-l border-zinc-800 flex flex-col justify-between shrink-0">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
            <div>
              <h2 className="font-black text-base text-white">Active Ticket</h2>
              <p className="text-xs text-zinc-500">{totalItemsCount} items in ticket</p>
            </div>
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition disabled:opacity-30"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
                <UtensilsCrossed className="w-10 h-10 stroke-1" />
                <p className="text-xs font-medium">Tap product tiles to build ticket</p>
              </div>
            ) : (
              cart.map((item) => {
                const itemPrice = formatPrice(item.product.price || (item.product as Product).unit_price);
                const subtotal = (parseFloat(itemPrice) * item.quantity).toFixed(2);

                return (
                  <div
                    key={item.product.id}
                    className="bg-zinc-950 border border-zinc-800/80 p-3 rounded-2xl flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-bold text-white truncate">{item.product.name}</p>
                      <p className="text-zinc-500 text-[11px]">€{itemPrice} x {item.quantity}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-black text-amber-400 pr-2">€{subtotal}</span>
                      <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs px-1">{item.quantity}</span>
                        <button
                          onClick={() => addToCart(item.product)}
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 border-t border-zinc-800 space-y-4 bg-zinc-950/80">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                  paymentMethod === 'card'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                <CreditCard className="w-4 h-4" /> Carte (CB)
              </button>
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                  paymentMethod === 'cash'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                <Banknote className="w-4 h-4" /> Espèces (Cash)
              </button>
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-2 bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Cash Received:</span>
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    placeholder="€0.00"
                    className="w-24 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-right text-xs font-bold text-amber-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-4 gap-1 pt-1">
                  {[5, 10, 20, 50].map((val) => (
                    <button
                      key={val}
                      onClick={() => setCashGiven(String(val))}
                      className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 py-1 text-[11px] font-bold rounded-lg"
                    >
                      €{val}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center text-xs pt-1 border-t border-zinc-800/80">
                  <span className="text-zinc-400">Change Due:</span>
                  <span className="font-extrabold text-emerald-400">€{changeDue.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 font-bold text-sm">Total Due:</span>
                <span className="text-2xl font-black text-amber-400">€{totalAmount.toFixed(2)}</span>
              </div>

              <button
                disabled={cart.length === 0 || isSubmitting}
                onClick={handleChargeOrder}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 transition active:scale-98"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {!isOnline ? 'Enregistrer (IndexedDB)' : 'Send to Kitchen & Charge'} (€
                    {totalAmount.toFixed(2)})
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Receipt Modal */}
      {completedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-6 text-center relative">
            <button
              onClick={() => setCompletedOrder(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
              {completedOrder.isOffline ? <HardDrive className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-white">
                {completedOrder.isOffline
                  ? 'Ticket Enregistré Hors-Ligne'
                  : 'Order Sent to Kitchen!'}
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
                onClick={() => printThermalReceipt(completedOrder)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4" /> Print Thermal
              </button>

              <button
                onClick={() => setCompletedOrder(null)}
                className="flex-1 bg-amber-500 text-zinc-950 font-bold py-3 rounded-xl text-xs transition"
              >
                Next Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
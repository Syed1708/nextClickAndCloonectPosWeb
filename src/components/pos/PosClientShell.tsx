'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Product, Order } from '@/types';
import { getImageUrl, formatPrice } from '@/lib/api';
import {
  saveOfflineOrderToDexie,
  getPendingOfflineOrdersCount,
  syncOfflineOrdersFromDexie,
} from '@/lib/offlineQueue';
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
  LogOut,
  Receipt,
  History,
  Lock,
  DollarSign,
  Undo2,
} from 'lucide-react';

interface PosCartItem {
  product: Product;
  quantity: number;
}

interface PosClientShellProps {
  initialProducts: Product[];
  cashierName: string;
  cashierRole: string;
  accessToken: string | null;
}

type OrderType = 'dine_in' | 'takeaway';
type PaymentMethod = 'cash' | 'card';

export default function PosClientShell({
  initialProducts,
  cashierName,
  cashierRole,
  accessToken,
}: PosClientShellProps) {
  const [products] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Register state
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cashGiven, setCashGiven] = useState<string>('');

  // Network & Sync State
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [showSalesHistoryModal, setShowSalesHistoryModal] = useState(false);
  const [showZClosureModal, setShowZClosureModal] = useState(false);

  // Sales History State
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const updatePendingCount = useCallback(async () => {
    const count = await getPendingOfflineOrdersCount();
    setPendingSyncCount(count);
  }, []);

  const triggerAutoSync = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;
    setIsSyncing(true);

    try {
      const result = await syncOfflineOrdersFromDexie(accessToken);
      await updatePendingCount();
      if (result.synced > 0) {
        console.log(`[Dexie Sync] Synced ${result.synced} orders.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  }, [accessToken, isSyncing, updatePendingCount]);

  useEffect(() => {
    updatePendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      triggerAutoSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const autoSyncInterval = setInterval(() => {
      if (navigator.onLine) triggerAutoSync();
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(autoSyncInterval);
    };
  }, [triggerAutoSync, updatePendingCount]);

  // Categories list
  const categories = [
    'All',
    ...Array.from(new Set(products.map((p) => p.category_name || 'Burgers'))),
  ];

  // Filter products by Search & Selected Category
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

  // Fetch Previous Sales History
  const fetchSalesHistory = async () => {
    setLoadingHistory(true);
    setShowSalesHistoryModal(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/pos/sales`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setSalesHistory(data.data || data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Issue Refund on a Previous Sale
  const handleRefundOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to refund this order?')) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/pos/refund/${orderId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (res.ok) {
        alert('Order refunded successfully!');
        fetchSalesHistory();
      } else {
        alert('Failed to process refund');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Charge Order
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
        await saveOfflineOrderToDexie(payload);
        await updatePendingCount();
        alert('Server unreachable. Saved to IndexedDB!');
        clearCart();
      }
    } catch (err) {
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
      {/* 🚀 TOP POS HEADER BAR */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              POS Terminal
            </h1>
            <p className="text-[11px] text-zinc-400">
              {cashierName} ({cashierRole})
            </p>
          </div>
        </div>

        {/* Manager Power Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Network Status / Sync */}
          {pendingSyncCount > 0 && (
            <button
              onClick={triggerAutoSync}
              disabled={isSyncing || !isOnline}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-3 py-1.5 rounded-xl text-xs font-black transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync ({pendingSyncCount})</span>
            </button>
          )}

          {/* Sales History & Refund */}
          <button
            onClick={fetchSalesHistory}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl text-xs font-bold transition"
          >
            <History className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Sales & Refund</span>
          </button>

          {/* Z-Closure / End Shift */}
          <button
            onClick={() => setShowZClosureModal(true)}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl text-xs font-bold transition"
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Z-Closure</span>
          </button>

          {/* Sign Out */}
          <button
            onClick={() => signOut({ callbackUrl: '/pos/login' })}
            className="p-2 bg-zinc-800 hover:bg-red-500/10 hover:text-red-400 text-zinc-400 rounded-xl transition"
            title="Sign Out Staff"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 🚀 MAIN 3-COLUMN SPLIT SCREEN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* COLUMN 1 (LEFT ~20%): Vertical Categories in 2 Columns */}
        <aside className="w-56 sm:w-64 xl:w-72 bg-zinc-900 border-r border-zinc-800 p-3 overflow-y-auto shrink-0 flex flex-col">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 px-1">
            Categories
          </span>

          <div className="grid grid-cols-2 gap-2 flex-1 auto-rows-max">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`p-3 rounded-2xl text-xs font-black text-center flex flex-col items-center justify-center gap-1.5 transition active:scale-95 ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/10'
                    : 'bg-zinc-950 text-zinc-300 border border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span className="line-clamp-2 leading-tight">{cat}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* COLUMN 2 (MIDDLE ~50%): Products Grid (3 - 4 Columns) */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-3">
          {/* Fast Search Bar */}
          <div className="relative shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Fast search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Product Touch Grid (3 Columns on medium, 4 Columns on large) */}
          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-max">
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

        {/* COLUMN 3 (RIGHT ~30%): Active Ticket Sidebar */}
        <aside className="w-80 sm:w-96 md:w-100 bg-zinc-900 border-l border-zinc-800 flex flex-col justify-between shrink-0">
          
          {/* Order Type Toggle Header */}
          <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
            <div className="flex bg-zinc-950 border border-zinc-800 p-1 rounded-xl gap-1">
              <button
                onClick={() => setOrderType('dine_in')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  orderType === 'dine_in' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'
                }`}
              >
                Sur Place
              </button>
              <button
                onClick={() => setOrderType('takeaway')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  orderType === 'takeaway' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'
                }`}
              >
                À Emporter
              </button>
            </div>

            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition disabled:opacity-30"
              title="Clear Ticket"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Ticket Line Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
                <ShoppingBag className="w-8 h-8 stroke-1" />
                <p className="text-xs font-medium">Tap products to build active ticket</p>
              </div>
            ) : (
              cart.map((item) => {
                const itemPrice = formatPrice(item.product.price || (item.product as Product).unit_price);
                const subtotal = (parseFloat(itemPrice) * item.quantity).toFixed(2);

                return (
                  <div
                    key={item.product.id}
                    className="bg-zinc-950 border border-zinc-800/80 p-2.5 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-bold text-white truncate">{item.product.name}</p>
                      <p className="text-zinc-500 text-[10px]">€{itemPrice} x {item.quantity}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-black text-amber-400 pr-1">€{subtotal}</span>
                      <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 text-zinc-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs px-1">{item.quantity}</span>
                        <button
                          onClick={() => addToCart(item.product)}
                          className="p-1 text-zinc-400 hover:text-white"
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

          {/* Payment & Tender Calculator */}
          <div className="p-3.5 border-t border-zinc-800 space-y-3 bg-zinc-950">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                  paymentMethod === 'card'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                <CreditCard className="w-4 h-4" /> Carte (CB)
              </button>
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                  paymentMethod === 'cash'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                <Banknote className="w-4 h-4" /> Espèces (Cash)
              </button>
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-2 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Cash Received:</span>
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    placeholder="€0.00"
                    className="w-20 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-right font-bold text-amber-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-4 gap-1">
                  {[5, 10, 20, 50].map((val) => (
                    <button
                      key={val}
                      onClick={() => setCashGiven(String(val))}
                      className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 py-1 text-[10px] font-bold rounded"
                    >
                      €{val}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-zinc-800/80">
                  <span className="text-zinc-400">Change Due:</span>
                  <span className="font-extrabold text-emerald-400">€{changeDue.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 font-bold text-xs">Total Due:</span>
                <span className="text-xl font-black text-amber-400">€{totalAmount.toFixed(2)}</span>
              </div>

              <button
                disabled={cart.length === 0 || isSubmitting}
                onClick={handleChargeOrder}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Charge & Send to Kitchen (€{totalAmount.toFixed(2)})</>
                )}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* 🚀 MODAL 1: SALES HISTORY & REFUND */}
      {showSalesHistoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" /> Recent POS Sales & Refunds
              </h3>
              <button onClick={() => setShowSalesHistoryModal(false)} className="text-zinc-500 hover:text-white">
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
                salesHistory.map((item: any) => (
                  <div key={item.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white">Order #{item.sequence_number || item.id}</p>
                      <p className="text-zinc-500 text-[10px]">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-amber-400 font-extrabold">€{Number(item.total_incl_vat || item.total_amount).toFixed(2)}</span>
                      <button
                        onClick={() => handleRefundOrder(item.id)}
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

      {/* 🚀 MODAL 2: SHIFT Z-CLOSURE */}
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
                <span>Total Shift Revenue:</span>
                <span className="font-black text-amber-400 text-sm">€0.00</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowZClosureModal(false)}
                className="flex-1 bg-zinc-800 text-zinc-400 font-bold py-3 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Shift Z-Closure report printed & register closed!');
                  setShowZClosureModal(false);
                }}
                className="flex-1 bg-emerald-500 text-zinc-950 font-bold py-3 rounded-xl text-xs"
              >
                Close Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
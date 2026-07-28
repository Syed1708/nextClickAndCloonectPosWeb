'use client';

import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types';
import { formatPrice } from '@/lib/api';
import { buildOrderSyncPayload } from '@/lib/posPayload';
import {
  saveOfflineOrderToDexie,
  getPendingOfflineOrdersCount,
  syncOfflineOrdersFromDexie,
} from '@/lib/offlineQueue';
import PosHeader from './PosHeader';
import PosCategorySidebar from './PosCategorySidebar';
import PosProductGrid from './PosProductGrid';
import PosTicketSidebar from './PosTicketSidebar';
import PosModals from './PosModals';


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

  // Customer Capture
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Register State
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'split'>('card');
  const [cashGiven, setCashGiven] = useState<string>('');
  
  // 🚀 SPLIT PAYMENT STATE
  const [splitCashAmount, setSplitCashAmount] = useState<string>('');

  // Network & Sync State
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [showSalesHistoryModal, setShowSalesHistoryModal] = useState(false);
  const [showZClosureModal, setShowZClosureModal] = useState(false);
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
        console.log(`[Dexie Sync] Synced ${result.synced} order(s).`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  }, [accessToken, isSyncing, updatePendingCount]);

  useEffect(() => {
    let isMounted = true;
    const loadInitialCount = async () => {
      const count = await getPendingOfflineOrdersCount();
      if (isMounted) setPendingSyncCount(count);
    };
    loadInitialCount();

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
      isMounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(autoSyncInterval);
    };
  }, [triggerAutoSync]);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category_name || 'Burgers')))];

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
    setSplitCashAmount(''); // 🚀 Reset split cash amount
    setCustomerName('');
    setCustomerPhone('');
  };

  const totalAmount = cart.reduce((sum, item) => {
    const priceVal = parseFloat(formatPrice(item.product.price || (item.product as any).unit_price));
    return sum + priceVal * item.quantity;
  }, 0);

  const fetchSalesHistory = async () => {
    setLoadingHistory(true);
    setShowSalesHistoryModal(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/pos/sales`,
        { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }
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

  const handleRefundOrder = async (orderId: number) => {
    if (!confirm('Refund this order?')) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/pos/refund/${orderId}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        }
      );
      if (res.ok) {
        alert('Order refunded!');
        fetchSalesHistory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 🚀 CHARGE ORDER WITH SPLIT PAYMENT SUPPORT
  const handleChargeOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    const cashGivenNum = parseFloat(cashGiven) || 0;
    const changeDue = Math.max(0, cashGivenNum - totalAmount);

    const splitCashNum = parseFloat(splitCashAmount) || 0;
    const splitCardNum = Math.max(0, totalAmount - splitCashNum);

    const payload = buildOrderSyncPayload(
      cart,
      paymentMethod,
      orderType,
      customerName,
      customerPhone,
      paymentMethod === 'split'
        ? { cashAmount: splitCashNum, cardAmount: splitCardNum }
        : undefined
    );



    // 🚀 Snapshot includes exact Cash & Card split amounts for receipt printing!
    const orderReceiptSnapshot = {
      items: [...cart],
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || null,
      orderType,
      paymentMethod,
      cashGiven: paymentMethod === 'cash' ? cashGivenNum : 0,
      changeDue: paymentMethod === 'cash' ? changeDue : 0,
      splitCashAmount: paymentMethod === 'split' ? splitCashNum : 0, // 👈 Added
      splitCardAmount: paymentMethod === 'split' ? splitCardNum : 0, // 👈 Added
      totalAmount,
      createdAt: new Date().toLocaleTimeString('fr-FR'),
    };

    if (!navigator.onLine) {
      const offlineRecord = await saveOfflineOrderToDexie(payload);
      await updatePendingCount();

      setCompletedOrder({
        ...orderReceiptSnapshot,
        id: offlineRecord.localUuid,
        sequence_number: 'LOCAL-DEXIE',
        isOffline: true,
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
        const serverOrder = data.orders?.find(
          (o: any) => o.uuid === payload.orders[0].uuid
        ) || data.orders?.[0];

        setCompletedOrder({
          ...orderReceiptSnapshot,
          id: serverOrder?.id || serverOrder?.uuid || 'SYNCED',
          sequence_number: serverOrder?.sequence_number || 'POS-1',
          isOffline: false,
        });

        clearCart();
      } else {
        await saveOfflineOrderToDexie(payload);
        await updatePendingCount();
        setCompletedOrder({
          ...orderReceiptSnapshot,
          id: 'DEXIE-SAVED',
          sequence_number: 'LOCAL-DEXIE',
          isOffline: true,
        });
        clearCart();
      }
    } catch (err) {
      const offlineRecord = await saveOfflineOrderToDexie(payload);
      await updatePendingCount();
      setCompletedOrder({
        ...orderReceiptSnapshot,
        id: offlineRecord.localUuid,
        sequence_number: 'LOCAL-DEXIE',
        isOffline: true,
      });
      clearCart();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-zinc-950 text-white flex flex-col font-sans overflow-hidden">
      <PosHeader
        cashierName={cashierName}
        cashierRole={cashierRole}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        isSyncing={isSyncing}
        onTriggerSync={triggerAutoSync}
        onOpenSalesHistory={fetchSalesHistory}
        onOpenZClosure={() => setShowZClosureModal(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <PosCategorySidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <PosProductGrid
          products={filteredProducts}
          search={search}
          onSearchChange={setSearch}
          onAddToCart={addToCart}
        />

        {/* 🚀 FIXED: Passes splitCashAmount and onSetSplitCashAmount to Sidebar! */}
        <PosTicketSidebar
          cart={cart}
          orderType={orderType}
          paymentMethod={paymentMethod}
          cashGiven={cashGiven}
          splitCashAmount={splitCashAmount}
          customerName={customerName}
          customerPhone={customerPhone}
          isSubmitting={isSubmitting}
          onSetOrderType={setOrderType}
          onSetPaymentMethod={setPaymentMethod}
          onSetCashGiven={setCashGiven}
          onSetSplitCashAmount={setSplitCashAmount}
          onSetCustomerName={setCustomerName}
          onSetCustomerPhone={setCustomerPhone}
          onAddToCart={addToCart}
          onRemoveFromCart={removeFromCart}
          onClearCart={clearCart}
          onChargeOrder={handleChargeOrder}
        />
      </div>

      <PosModals
        completedOrder={completedOrder}
        showSalesHistoryModal={showSalesHistoryModal}
        showZClosureModal={showZClosureModal}
        salesHistory={salesHistory}
        loadingHistory={loadingHistory}
        cashierName={cashierName}
        onCloseCompletedModal={() => setCompletedOrder(null)}
        onCloseSalesHistoryModal={() => setShowSalesHistoryModal(false)}
        onCloseZClosureModal={() => setShowZClosureModal(false)}
        onRefundOrder={handleRefundOrder}
      />
    </div>
  );
}
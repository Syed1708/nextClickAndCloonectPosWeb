'use client';

import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types';
import { formatPrice } from '@/lib/api';
import { buildOrderSyncPayload } from '@/lib/posPayload';
import {
  getPendingOfflineOrdersCount,
  syncOfflineOrdersFromDexie,
  saveOrderLocallyToDexie,
} from '@/lib/offlineQueue';
import PosHeader from './PosHeader';
import PosCategorySidebar from './PosCategorySidebar';
import PosProductGrid from './PosProductGrid';
import PosTicketSidebar from './PosTicketSidebar';
import PosModals from './PosModals';


export interface PosCartItem {
  product: Product;
  quantity: number;
  notes?: string[];     // 🚀 Fixes Property 'notes' does not exist error!
  extraPrice?: number;  // 🚀 Fixes Property 'extraPrice' does not exist error!
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

  // 🚀 ADD WITH NOTES & EXTRAS
  const addToCartWithNotes = (
    product: Product,
    notes: string[] = [],
    extraPrice: number = 0
  ) => {
    setCart((prev) => {
      const notesKey = notes.sort().join('|');

      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          (item.notes || []).sort().join('|') === notesKey
      );

      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          product,
          quantity: 1,
          notes,
          extraPrice,
        },
      ];
    });
  };

  // 🚀 REMOVE BY PRODUCT ID AND NOTES KEY
  const removeFromCartWithNotes = (product: Product, notes: string[] = []) => {
    const notesKey = notes.sort().join('|');

    setCart((prev) =>
      prev
        .map((item) => {
          if (
            item.product.id === product.id &&
            (item.notes || []).sort().join('|') === notesKey
          ) {
            return { ...item, quantity: item.quantity - 1 };
          }
          return item;
        })
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

// 🚀 HARDENED WEB REFUND HANDLER
  const handleRefundOrder = async (orderId: number) => {
    // 1. Pre-check if order is already refunded in state
    const targetOrder = salesHistory.find((o) => o.id === orderId);

    if (targetOrder) {
      const isAlreadyRefunded =
        targetOrder.status === 'refunded' ||
        targetOrder.preparation_status === 'cancelled' ||
        targetOrder.order_type === 'refund' ||
        (targetOrder.customer_name && targetOrder.customer_name.includes('AVOIR')) ||
        Number(targetOrder.total_incl_vat || targetOrder.total_amount) < 0;

      if (isAlreadyRefunded) {
        alert('Cette commande a déjà fait l\'objet d\'un remboursement ou d\'un avoir.');
        return;
      }
    }

    if (!confirm('Voulez-vous vraiment rembourser cette commande ?')) return;

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

      const data = await res.json();

      if (res.ok) {
        alert(data.message || 'Commande remboursée avec succès !');
        fetchSalesHistory(); // 🚀 Refresh sales history from server
      } else {
        alert(data.message || data.error || 'Échec du remboursement');
      }
    } catch (e) {
      console.error('Refund Exception:', e);
      alert('Erreur lors du traitement du remboursement');
    }
  };

  // 🚀 CHARGE ORDER WITH SPLIT PAYMENT SUPPORT
  // 🚀 CLEANED UP: 100% Dynamic Per-Product TVA Calculation!
  const handleChargeOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    let subtotalHtSum = 0;
    let vatSum = 0;

    // Calculate HT and TVA dynamically per product
    cart.forEach((item) => {
      const unitPrice = parseFloat(
        formatPrice(item.product.price || (item.product as any).unit_price)
      );

      // Read dynamic TVA set in tyro-dashboard (5.5, 10, or 20)
      const itemVatRate = parseFloat(
        String(
          item.product.vat_rate ||
          (item.product as any).vat_rate ||
          (item.product as any).tva ||
          '10.00'
        )
      );

      const lineTotalTtc = unitPrice * item.quantity;
      const lineSubtotalHt = lineTotalTtc / (1 + itemVatRate / 100);
      const lineVatAmount = lineTotalTtc - lineSubtotalHt;

      subtotalHtSum += lineSubtotalHt;
      vatSum += lineVatAmount;
    });

    const orderUuid = self.crypto.randomUUID();
    const splitCashNum = parseFloat(splitCashAmount) || 0;
    const splitCardNum = Math.max(0, totalAmount - splitCashNum);
    // Calculate change due when paying with cash
    const changeDue = Math.max(0, (parseFloat(cashGiven) || 0) - totalAmount);

    const orderReceiptSnapshot = {
      items: [...cart],
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || null,
      orderType,
      paymentMethod,
      cashGiven: paymentMethod === 'cash' ? cashGiven : 0,
      changeDue: paymentMethod === 'cash' ? changeDue : 0,
      splitCashAmount: paymentMethod === 'split' ? splitCashNum : 0,
      splitCardAmount: paymentMethod === 'split' ? splitCardNum : 0,
      totalAmount,
      createdAt: new Date().toLocaleTimeString('fr-FR'),
    };

    // 🚀 OFFLINE BRANCH (Saves to Dexie.js IndexedDB with dynamic TVA)
    if (!navigator.onLine) {
      const seqNum = await saveOrderLocallyToDexie(
        orderUuid,
        parseFloat(subtotalHtSum.toFixed(2)),
        parseFloat(vatSum.toFixed(2)),
        parseFloat(totalAmount.toFixed(2)),
        cart,
        paymentMethod,
        orderType,
        customerName,
        customerPhone,
        paymentMethod === 'split' ? { cashAmount: splitCashNum, cardAmount: splitCardNum } : undefined
      );

      await updatePendingCount();

      setCompletedOrder({
        ...orderReceiptSnapshot,
        id: orderUuid,
        sequence_number: `#${seqNum} (LOCAL)`,
        isOffline: true,
      });

      clearCart();
      setIsSubmitting(false);
      return;
    }

    // 🚀 ONLINE BRANCH (Sends dynamic TVA payload to Laravel OrderSyncController)
    try {
      const payload = buildOrderSyncPayload(
        cart,
        paymentMethod,
        orderType,
        customerName,
        customerPhone,
        paymentMethod === 'split' ? { cashAmount: splitCashNum, cardAmount: splitCardNum } : undefined
      );

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
        const serverOrder = data.orders?.[0];
        setCompletedOrder({
          ...orderReceiptSnapshot,
          id: serverOrder?.id || orderUuid,
          sequence_number: serverOrder?.sequence_number || 'POS',
          isOffline: false,
        });
        clearCart();
      } else {
        await saveOrderLocallyToDexie(
          orderUuid,
          parseFloat(subtotalHtSum.toFixed(2)),
          parseFloat(vatSum.toFixed(2)),
          parseFloat(totalAmount.toFixed(2)),
          cart,
          paymentMethod,
          orderType,
          customerName,
          customerPhone
        );
        await updatePendingCount();
        clearCart();
      }
    } catch (err) {
      await saveOrderLocallyToDexie(
        orderUuid,
        parseFloat(subtotalHtSum.toFixed(2)),
        parseFloat(vatSum.toFixed(2)),
        parseFloat(totalAmount.toFixed(2)),
        cart,
        paymentMethod,
        orderType,
        customerName,
        customerPhone
      );
      await updatePendingCount();
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
          onAddToCart={addToCartWithNotes} // 👈 Pass function here!
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
          onAddToCart={addToCartWithNotes}
          onRemoveFromCart={removeFromCartWithNotes} // 👈 Pass accurate remove function!
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
        accessToken={accessToken} // 🚀 Pass accessToken here
        onCloseCompletedModal={() => setCompletedOrder(null)}
        onCloseSalesHistoryModal={() => setShowSalesHistoryModal(false)}
        onCloseZClosureModal={() => setShowZClosureModal(false)}
        onRefundOrder={handleRefundOrder}
      />
    </div>
  );
}
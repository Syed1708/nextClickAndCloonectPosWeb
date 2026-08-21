'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Product, OptionGroup, OptionItem } from '@/types';
import { getImageUrl, formatPrice } from '@/lib/api';
import {
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  Sparkles,
  CreditCard,
  Banknote,
  UtensilsCrossed,
  RotateCcw,
  QrCode,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Info,
  Gift,
} from 'lucide-react';

export interface PriceBreakdownItem {
  label: string;
  price: number;
  isFree?: boolean;
}

export interface KioskCartItem {
  product: Product;
  quantity: number;
  selectedOptions: Record<number, string[]>;
  notes: string[];
  priceBreakdown: PriceBreakdownItem[]; // 🚀 Itemized price breakdown!
  extraPrice: number;
}

export default function KioskClientShell({ initialProducts }: { initialProducts: Product[] }) {
  // Screen States: 'attract' | 'dining_option' | 'customer_id' | 'ordering' | 'payment' | 'completed'
  const [screenState, setScreenState] = useState<'attract' | 'dining_option' | 'customer_id' | 'ordering' | 'payment' | 'completed'>('attract');
  const [diningOption, setDiningOption] = useState<'kiosk_eat_in' | 'kiosk_takeaway'>('kiosk_eat_in');

  // Customer ID
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [clientIdNumber, setClientIdNumber] = useState('');
  const [isQrScanning, setIsQrScanning] = useState(false);

  // Menu Catalog State
  const [products] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<KioskCartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // 🚀 DYNAMIC WIZARD STATE
  const [activeBuildingProduct, setActiveBuildingProduct] = useState<Product | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [stepSelections, setStepSelections] = useState<Record<number, string[]>>({});

  // Payment & Confirmation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedTicket, setCompletedTicket] = useState<{ ticketNumber: string; total: number } | null>(null);
  const [autoResetTimer, setAutoResetTimer] = useState(10);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  const getProductCategory = (p: Product) => p.category?.name || (p as any).category_name || 'Uncategorized';

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(products.map((p) => getProductCategory(p))))];
  }, [products]);

  const filteredProducts = products.filter(
    (p) => selectedCategory === 'All' || getProductCategory(p) === selectedCategory
  );

  // 🚀 SMART COMBO DRINK PRICING CHECK
  // If cart has at least 1 burger or tacos, soft drinks cost €1.70 instead of €2.10!
  const hasBurgerInCart = useMemo(() => {
    return cart.some((item) => {
      const cat = (getProductCategory(item.product) || '').toLowerCase();
      return cat.includes('burger') || cat.includes('tacos');
    });
  }, [cart]);

  const getItemUnitPrice = useCallback((item: KioskCartItem) => {
    const isDrink = (getProductCategory(item.product) || '').toLowerCase().includes('drink') ||
                    (getProductCategory(item.product) || '').toLowerCase().includes('beverage');

    if (isDrink) {
      return hasBurgerInCart ? 1.70 : 2.10; // €1.70 Combo vs €2.10 A La Carte
    }

    const basePrice = parseFloat(formatPrice(item.product.price || (item.product as any).unit_price));
    return basePrice + item.extraPrice;
  }, [hasBurgerInCart]);

  const totalAmount = cart.reduce((sum, item) => sum + getItemUnitPrice(item) * item.quantity, 0);
  const totalItemCount = cart.reduce((a, c) => a + c.quantity, 0);

  // Product Tap Handler
  const handleSelectProduct = (product: Product) => {
    const groups: OptionGroup[] =
      (product as any).option_groups || (product as any).optionGroups || [];

    if (!groups || groups.length === 0) {
      const basePrice = parseFloat(formatPrice(product.price || (product as any).unit_price));
      setCart((prev) => [
        ...prev,
        {
          product,
          quantity: 1,
          selectedOptions: {},
          notes: [],
          priceBreakdown: [{ label: 'Base Item', price: basePrice }],
          extraPrice: 0,
        },
      ]);
      return;
    }

    setActiveBuildingProduct(product);
    setCurrentStepIndex(0);
    setStepSelections({});
  };

  // Toggle Option Choice
  const handleToggleOption = (group: OptionGroup, option: OptionItem) => {
    const groupId = group.id;
    const currentList = stepSelections[groupId] || [];

    if (group.selection_type === 'single_select') {
      setStepSelections({ ...stepSelections, [groupId]: [option.name] });
    } else {
      if (currentList.includes(option.name)) {
        setStepSelections({
          ...stepSelections,
          [groupId]: currentList.filter((name) => name !== option.name),
        });
      } else {
        if (group.max_selections > 0 && currentList.length >= group.max_selections) {
          return;
        }
        setStepSelections({ ...stepSelections, [groupId]: [...currentList, option.name] });
      }
    }
  };

  // 🚀 FINISH CUSTOMIZATION & BUILD DETAILED ITEMIZED PRICE BREAKDOWN
  const handleFinishCustomization = () => {
    if (!activeBuildingProduct) return;

    const groups: OptionGroup[] =
      (activeBuildingProduct as any).option_groups || (activeBuildingProduct as any).optionGroups || [];
    
    let extraPrice = 0;
    const notes: string[] = [];
    const priceBreakdown: PriceBreakdownItem[] = [];

    const basePrice = parseFloat(formatPrice(activeBuildingProduct.price || (activeBuildingProduct as any).unit_price));
    priceBreakdown.push({ label: 'Base Price', price: basePrice });

    groups.forEach((group) => {
      const selectedNames = stepSelections[group.id] || [];
      const freeLimit = group.pivot?.free_choice_limit_override ?? group.free_choice_limit ?? 0;

      if (selectedNames.length > 0) {
        notes.push(`${group.name}: ${selectedNames.join(', ')}`);
      }

      selectedNames.forEach((optName, index) => {
        const optionObj = group.options?.find((o) => o.name === optName);
        if (optionObj) {
          const isFree = index < freeLimit;
          const cost = isFree ? 0.00 : optionObj.extra_price;

          priceBreakdown.push({
            label: `${group.name}: ${optName}`,
            price: cost,
            isFree,
          });

          if (!isFree) {
            extraPrice += optionObj.extra_price;
          }
        }
      });
    });

    setCart((prev) => [
      ...prev,
      {
        product: activeBuildingProduct,
        quantity: 1,
        selectedOptions: stepSelections,
        notes,
        priceBreakdown,
        extraPrice,
      },
    ]);

    setActiveBuildingProduct(null);
    setCurrentStepIndex(0);
    setStepSelections({});
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item, idx) => (idx === index ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  // Submit Order API
  const handleCheckout = async (paymentChoice: 'pay_at_counter' | 'card_terminal') => {
    if (cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/kiosk/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          cart: cart.map((item) => ({
            id: item.product.id,
            quantity: item.quantity,
            notes: item.notes || [],
            extraPrice: item.extraPrice || 0,
          })),
          order_type: diningOption,
          payment_choice: paymentChoice,
          customer_name: customerName || (clientIdNumber ? `Client #${clientIdNumber}` : 'Kiosk Customer'),
          customer_phone: customerPhone || null,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCompletedTicket({ ticketNumber: data.ticket_number, total: data.total });
        setCart([]);
        setScreenState('completed');
        setAutoResetTimer(10);
      } else {
        alert(data.message || 'Failed to submit kiosk order.');
      }
    } catch (err) {
      alert('Error submitting kiosk order.');
    } finally {
      setIsSubmitting(false);
    }
  };

   const handleResetKiosk = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setClientIdNumber('');
    setActiveBuildingProduct(null);
    setScreenState('attract');
  };
  // Auto-reset Timer
  useEffect(() => {
    if (screenState !== 'completed') return;

    const interval = setInterval(() => {
      setAutoResetTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleResetKiosk();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [screenState]);

 

  const handleSimulateQrScan = () => {
    setIsQrScanning(true);
    setTimeout(() => {
      setCustomerName('Syed (Loyalty Member)');
      setCustomerPhone('+33612345678');
      setClientIdNumber('1042');
      setIsQrScanning(false);
      setScreenState('ordering');
    }, 1200);
  };

  // 1. ATTRACT SCREEN
  if (screenState === 'attract') {
    return (
      <div
        onClick={() => setScreenState('dining_option')}
        className="h-screen w-screen bg-zinc-950 text-white flex flex-col items-center justify-between p-12 cursor-pointer select-none relative overflow-hidden"
      >
        <div className="text-center space-y-4 pt-12 z-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-extrabold px-6 py-2 rounded-full uppercase tracking-widest">
            <Sparkles className="w-4 h-4" /> Self-Service Order Kiosk
          </div>
          <h1 className="text-6xl font-black text-white">Burger Palace Bordeaux</h1>
          <p className="text-zinc-400 text-lg">Fresh Gourmet Burgers &amp; Artisan Dishes</p>
        </div>

        <div className="z-10 flex flex-col items-center gap-6 animate-pulse">
          <div className="w-32 h-32 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center shadow-2xl">
            <ShoppingBag className="w-16 h-16 text-amber-400" />
          </div>
          <span className="text-3xl font-black text-amber-400 uppercase">Touch Screen To Start Order</span>
        </div>

        <div className="z-10 text-zinc-500 text-xs font-bold uppercase tracking-widest">
          Tap anywhere on the display to begin
        </div>
      </div>
    );
  }

  // 2. DINING OPTION SELECTION
  if (screenState === 'dining_option') {
    return (
      <div className="h-screen w-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-12 select-none space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-black text-white">Where will you be dining today?</h2>
          <p className="text-zinc-400 text-base">Select your dining preference</p>
        </div>

        <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
          <button
            onClick={() => {
              setDiningOption('kiosk_eat_in');
              setScreenState('customer_id');
            }}
            className="bg-zinc-900 border-2 border-zinc-800 hover:border-amber-500 rounded-3xl p-12 flex flex-col items-center justify-center gap-6 transition transform active:scale-95 group shadow-2xl"
          >
            <UtensilsCrossed className="w-16 h-16 text-amber-500" />
            <span className="text-3xl font-black">🍽️ Eat In</span>
          </button>

          <button
            onClick={() => {
              setDiningOption('kiosk_takeaway');
              setScreenState('customer_id');
            }}
            className="bg-zinc-900 border-2 border-zinc-800 hover:border-amber-500 rounded-3xl p-12 flex flex-col items-center justify-center gap-6 transition transform active:scale-95 group shadow-2xl"
          >
            <ShoppingBag className="w-16 h-16 text-amber-500" />
            <span className="text-3xl font-black">🛍️ Takeaway</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. CUSTOMER IDENTIFICATION
  if (screenState === 'customer_id') {
    return (
      <div className="h-screen w-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-26 select-none space-y-8  mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-white">Customer Identification</h2>
          <p className="text-zinc-400 text-sm">Identify yourself to earn loyalty points or continue as guest</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
            <h3 className="font-extrabold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" /> Enter Customer Info
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Syed"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +33612345678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Client ID Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 1042"
                  value={clientIdNumber}
                  onChange={(e) => setClientIdNumber(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col justify-between space-y-6 text-center">
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-amber-400 uppercase tracking-wider">Scan Loyalty QR Code</h3>
              <div className="w-24 h-24 bg-amber-500/10 border-2 border-dashed border-amber-500/40 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
                <QrCode className="w-12 h-12" />
              </div>
              <p className="text-xs text-zinc-400">Scan your loyalty QR code on the scanner below</p>
              <button
                type="button"
                onClick={handleSimulateQrScan}
                className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold px-4 py-2.5 rounded-xl text-xs transition"
              >
                {isQrScanning ? 'Scanning...' : 'Simulate QR Code Scan'}
              </button>
            </div>

            <button
              onClick={() => setScreenState('ordering')}
              className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black py-4 rounded-2xl text-xs transition flex items-center justify-center gap-2"
            >
              <span>Continue to Menu →</span>
            </button>
          </div>
        </div>

        <button onClick={() => setScreenState('dining_option')} className="text-zinc-500 hover:text-white font-bold text-xs">
          ← Back to Dining Option
        </button>
      </div>
    );
  }

  // 4. ORDER COMPLETED SCREEN
  if (screenState === 'completed') {
    return (
      <div className="h-screen w-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-12 text-center select-none space-y-8">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white">Order Sent to Kitchen!</h2>
          <p className="text-zinc-400 text-sm">Please watch the screen for your order number.</p>
        </div>

        <div className="bg-zinc-900 border-2 border-amber-500 px-12 py-8 rounded-3xl shadow-2xl">
          <span className="text-xs text-zinc-400 font-bold uppercase block">Your Ticket Number</span>
          <span className="text-7xl font-black text-amber-400">{completedTicket?.ticketNumber}</span>
          <span className="text-sm font-bold text-white block mt-2">Total Paid: €{completedTicket?.total.toFixed(2)}</span>
        </div>

        <p className="text-xs text-zinc-500 font-bold">Screen resets in {autoResetTimer}s...</p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 5. MAIN TOUCH CATALOG & MIDDLE STEP-BY-STEP WIZARD
  // -------------------------------------------------------------
  const groups: OptionGroup[] = activeBuildingProduct
    ? (activeBuildingProduct as any).option_groups || (activeBuildingProduct as any).optionGroups || []
    : [];

  const currentGroup = groups[currentStepIndex];
  const freeChoiceLimit = currentGroup
    ? currentGroup.pivot?.free_choice_limit_override ?? currentGroup.free_choice_limit ?? 0
    : 0;

  return (
    <div className="h-screen w-screen bg-zinc-950 text-white flex flex-col select-none overflow-hidden">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={handleResetKiosk} className="p-2.5 bg-zinc-800 text-zinc-300 rounded-xl font-bold text-xs flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Start Over
          </button>
          <div>
            <span className="text-xs text-amber-400 font-bold uppercase block">
              {diningOption === 'kiosk_eat_in' ? '🍽️ Dining In' : '🛍️ Takeaway'}
            </span>
            <span className="text-xs text-zinc-400">
              Customer: {customerName || (clientIdNumber ? `Client #${clientIdNumber}` : 'Guest')}
            </span>
          </div>
        </div>

        <button
          onClick={() => setScreenState('payment')}
          disabled={cart.length === 0}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-zinc-950 font-black px-8 py-3 rounded-2xl text-xs transition"
        >
          View Cart ({totalItemCount}) — €{totalAmount.toFixed(2)}
        </button>
      </header>

      {/* Main Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Categories */}
        <div className="w-56 bg-zinc-900/60 border-r border-zinc-800 p-4 space-y-2 overflow-y-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setActiveBuildingProduct(null);
              }}
              className={`w-full py-4 px-5 rounded-2xl font-black text-xs text-left transition ${
                selectedCategory === cat && !activeBuildingProduct
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* MIDDLE SECTION: CATALOG GRID OR DYNAMIC WIZARD */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between">
          {!activeBuildingProduct ? (
            /* CATALOG GRID VIEW */
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
              {filteredProducts.map((product) => {
                const basePrice = parseFloat(formatPrice(product.price || (product as any).unit_price));
                const isDrink = (getProductCategory(product) || '').toLowerCase().includes('drink');
                const displayPrice = isDrink && hasBurgerInCart ? 1.70 : basePrice;

                return (
                  <div
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className="bg-zinc-900 border-2 border-zinc-800 hover:border-amber-500 rounded-3xl p-5 flex flex-col justify-between cursor-pointer group transition active:scale-95 shadow-xl h-64 relative"
                  >
                    {/* 🚀 SMART COMBO PRICING BADGE EXPLANATION */}
                    {isDrink && (
                      <span className="absolute top-3 left-3 bg-emerald-500 text-zinc-950 text-[10px] font-black px-2.5 py-1 rounded-full uppercase z-10">
                        {hasBurgerInCart ? '🥤 Meal Combo €1.70' : '🥤 Soft Drink €2.10'}
                      </span>
                    )}

                    <div className="relative w-full h-32 rounded-2xl bg-zinc-800 overflow-hidden mb-3">
                      <Image src={getImageUrl(product.image_path)} alt={product.name} fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white truncate">{product.name}</h3>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-amber-400 font-black text-base">€{displayPrice.toFixed(2)}</span>
                        <button className="bg-amber-500 text-zinc-950 p-2 rounded-xl font-bold">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* 🚀 DYNAMIC WIZARD STEPS WITH FREE ALLOWANCE BANNER & SMART BADGES */
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-3 pb-3 border-b border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-amber-400 font-bold uppercase">Customizing {activeBuildingProduct.name}</span>
                    <h2 className="text-2xl font-black text-white">{currentGroup?.name}</h2>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-zinc-500 font-bold">
                      Step {currentStepIndex + 1} of {groups.length}
                    </span>
                    <button
                      onClick={() => setActiveBuildingProduct(null)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>

                {/* 🚀 FREE ALLOWANCE INSTRUCTION BANNER */}
                {currentGroup && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex items-center justify-between text-xs text-amber-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-amber-500" />
                      Step Instruction: {currentGroup.name}
                    </span>
                    <span>
                      {freeChoiceLimit > 0 ? `✨ ${freeChoiceLimit} Free Choice(s) Included` : 'Paid Suppléments'}
                      {currentGroup.selection_type === 'multi_select' && freeChoiceLimit > 0 ? ' (Extra choices +extra cost)' : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Dynamic Option Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1 overflow-y-auto pr-1">
                {currentGroup?.options?.map((opt) => {
                  const selectedList = stepSelections[currentGroup.id] || [];
                  const isSelected = selectedList.includes(opt.name);
                  const selectedIndex = selectedList.indexOf(opt.name);

                  // 🚀 DETERMINES IF THIS CHOICE IS FREE OR PAID
                  let isFreeChoice = false;
                  let priceLabel = '';

                  if (currentGroup.selection_type === 'single_select') {
                    if (freeChoiceLimit > 0) {
                      isFreeChoice = true;
                      priceLabel = 'INCLUDED (€0.00)';
                    } else {
                      priceLabel = opt.extra_price > 0 ? `+€${opt.extra_price.toFixed(2)}` : 'FREE';
                    }
                  } else { // multi_select
                    if (isSelected) {
                      isFreeChoice = selectedIndex < freeChoiceLimit;
                      priceLabel = isFreeChoice ? 'INCLUDED (€0.00)' : `+€${opt.extra_price.toFixed(2)}`;
                    } else {
                      if (selectedList.length < freeChoiceLimit) {
                        isFreeChoice = true;
                        priceLabel = freeChoiceLimit > 0 ? 'FREE INCLUDED' : (opt.extra_price > 0 ? `+€${opt.extra_price.toFixed(2)}` : 'FREE');
                      } else {
                        priceLabel = opt.extra_price > 0 ? `+€${opt.extra_price.toFixed(2)}` : 'FREE';
                      }
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleToggleOption(currentGroup, opt)}
                      className={`p-5 rounded-3xl border-2 flex flex-col justify-between text-left transition active:scale-95 ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 text-white ring-2 ring-amber-500/40'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      {opt.image_path && (
                        <div className="relative w-full h-24 rounded-xl bg-zinc-800 overflow-hidden mb-3">
                          <Image src={getImageUrl(opt.image_path)} alt={opt.name} fill className="object-cover" />
                        </div>
                      )}
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-sm">{opt.name}</span>
                          {isSelected && <Check className="w-5 h-5 text-amber-400" />}
                        </div>

                        {/* 🚀 SMART PRICE / INCLUDED BADGE */}
                        <span className={`text-xs font-black block mt-1.5 ${isFreeChoice ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {priceLabel}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Wizard Navigation Footer */}
              <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
                <button
                  onClick={() => {
                    if (currentStepIndex > 0) setCurrentStepIndex((prev) => prev - 1);
                    else setActiveBuildingProduct(null);
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white font-black px-6 py-3.5 rounded-2xl text-xs flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> {currentStepIndex === 0 ? 'Cancel Item' : 'Previous Step'}
                </button>

                {currentStepIndex < groups.length - 1 ? (
                  <button
                    onClick={() => setCurrentStepIndex((prev) => prev + 1)}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black px-8 py-3.5 rounded-2xl text-xs flex items-center gap-2"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleFinishCustomization}
                    className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black px-8 py-3.5 rounded-2xl text-xs flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Finish &amp; Add to Cart
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 🚀 RIGHT ACTIVE CART SIDEBAR WITH ITEMISED PRICE BREAKDOWN */}
        <div className="w-80 bg-zinc-900 border-l border-zinc-800 p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-base text-white pb-3 border-b border-zinc-800 flex justify-between">
              <span>Your Cart</span>
              <span className="text-amber-400">{totalItemCount} Items</span>
            </h3>

            <div className="mt-4 space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <p className="text-center py-12 text-zinc-500 text-xs">Your cart is empty.</p>
              ) : (
                cart.map((item, idx) => {
                  const unitPrice = getItemUnitPrice(item);

                  return (
                    <div key={idx} className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-2xl space-y-2">
                      <div className="flex justify-between items-start text-xs">
                        <div>
                          <span className="font-bold text-white">{item.product.name}</span>
                          <p className="text-amber-400 font-black">€{(unitPrice * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-zinc-900 px-2 py-1 rounded-lg">
                          <button onClick={() => updateQuantity(idx, -1)} className="text-zinc-400 font-bold">-</button>
                          <span className="font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(idx, 1)} className="text-zinc-400 font-bold">+</button>
                        </div>
                      </div>

                      {/* 🚀 ITEMIZED PRICE BREAKDOWN */}
                      <div className="pt-2 border-t border-zinc-900 space-y-1 text-[11px]">
                        {item.priceBreakdown?.map((bp, bIdx) => (
                          <div key={bIdx} className="flex justify-between text-zinc-400">
                            <span className="truncate max-w-[180px]">• {bp.label}</span>
                            <span className="font-bold">
                              {bp.price === 0 ? (
                                <span className="text-emerald-400 text-[10px]">INCLUDED</span>
                              ) : (
                                `+€${bp.price.toFixed(2)}`
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 space-y-3">
            <div className="flex justify-between font-black text-xl">
              <span>Total TTC</span>
              <span className="text-amber-400">€{totalAmount.toFixed(2)}</span>
            </div>

            <button
              disabled={cart.length === 0}
              onClick={() => setScreenState('payment')}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-zinc-950 font-black py-4 rounded-2xl text-xs transition"
            >
              Checkout &amp; Pay (€{totalAmount.toFixed(2)})
            </button>
          </div>
        </div>
      </div>

      {/* PAYMENT METHOD MODAL */}
      {screenState === 'payment' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-xl w-full space-y-6 text-center relative shadow-2xl">
            <button
              onClick={() => setScreenState('ordering')}
              className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-2xl font-black text-white">Select Payment Method</h3>
              <p className="text-zinc-400 text-xs mt-1">Total Due: <strong className="text-amber-400">€{totalAmount.toFixed(2)}</strong></p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <button
                disabled={isSubmitting}
                onClick={() => handleCheckout('card_terminal')}
                className="bg-zinc-950 border-2 border-zinc-800 hover:border-amber-500 p-8 rounded-2xl flex flex-col items-center gap-4 transition group"
              >
                <CreditCard className="w-10 h-10 text-amber-500 group-hover:scale-110 transition" />
                <span className="font-black text-base text-white">Pay by Card</span>
                <span className="text-[10px] text-zinc-400">Tap / Insert Card on Kiosk Terminal</span>
              </button>

              <button
                disabled={isSubmitting}
                onClick={() => handleCheckout('pay_at_counter')}
                className="bg-zinc-950 border-2 border-zinc-800 hover:border-amber-500 p-8 rounded-2xl flex flex-col items-center gap-4 transition group"
              >
                <Banknote className="w-10 h-10 text-emerald-400 group-hover:scale-110 transition" />
                <span className="font-black text-base text-white">Pay at Counter</span>
                <span className="text-[10px] text-zinc-400">Pay Cash or Card to Cashier</span>
              </button>
            </div>

            <div className="pt-2 border-t border-zinc-800">
              <button
                onClick={() => setScreenState('ordering')}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Cancel &amp; Back to Order Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
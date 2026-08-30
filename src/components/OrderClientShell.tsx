'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Plus,
  Minus,
  ArrowLeft,
  Search,
  Loader2,
  Lock,
  X,
  AlertCircle,
  Clock,
  Info,
  Tag,
  Gift,
} from 'lucide-react';
import { Product } from '@/types';
import { getImageUrl, formatPrice } from '@/lib/api';
import ProductStepModal from '@/components/common/ProductStepModal';

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string[];
  extraPrice?: number;
}

interface OrderClientShellProps {
  initialProducts: Product[];
  isLoggedIn: boolean;
  accessToken: string | null;
  userName: string | null;
  initialPoints?: number;
}

export default function OrderClientShell({
  initialProducts,
  isLoggedIn,
  accessToken,
  userName,
  initialPoints = 0,
}: OrderClientShellProps) {
  const router = useRouter();

  const [products] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [visibleCount, setVisibleCount] = useState(10);

  // Active product selected for step customization modal
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  // Promo Code & Loyalty Points State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_amount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState<boolean>(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

  // Store Opening & Global Schedule State
  const [storeStatus, setStoreStatus] = useState<{
    is_open: boolean;
    is_store_open: boolean;
    online_orders_enabled: boolean;
    schedule: string;
    closed_message: string;
  }>({
    is_open: true,
    is_store_open: true,
    online_orders_enabled: true,
    schedule: '10:00 - 14:30 & 18:30 - 22:30',
    closed_message: 'Restaurant is currently closed for online ordering.',
  });

  useEffect(() => {
    async function checkStoreStatus() {
      try {
        const res = await fetch(`${API_BASE}/store-status`);
        if (res.ok) {
          const data = await res.json();
          setStoreStatus(data);
        }
      } catch (e) {
        console.error('Failed to fetch store status:', e);
      }
    }
    checkStoreStatus();
  }, [API_BASE]);

  // Client Loyalty Points State
  const [clientPoints, setClientPoints] = useState<number>(initialPoints);
  const [prevInitialPoints, setPrevInitialPoints] = useState<number>(initialPoints);

  // React 19 Prop Sync
  if (prevInitialPoints !== initialPoints) {
    setPrevInitialPoints(initialPoints);
    setClientPoints(initialPoints);
  }

  useEffect(() => {
    if (!isLoggedIn || !accessToken) return;

    let isCancelled = false;

    async function fetchPoints() {
      try {
        const res = await fetch(`${API_BASE}/client/profile`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const points =
            data.client?.loyalty_points ??
            data.loyalty_points ??
            data.data?.loyalty_points ??
            0;

          if (!isCancelled) {
            setClientPoints(Number(points));
          }
        }
      } catch (e) {
        console.error('Error fetching client points:', e);
      }
    }

    fetchPoints();

    return () => {
      isCancelled = true;
    };
  }, [API_BASE, isLoggedIn, accessToken]);

  // Master Permission Check for Online Ordering
  const canOrderOnline =
    storeStatus.is_store_open &&
    storeStatus.online_orders_enabled &&
    storeStatus.is_open;

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  const categories = [
    'All',
    ...Array.from(new Set(products.map((p) => p.category_name || (p.category?.name ?? 'Burgers')))),
  ];

  const filteredProducts = products.filter((product) => {
    const categoryName = product.category_name || product.category?.name || 'Burgers';
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || categoryName === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  // Add Item to Cart (with Notes & Options)
  const addToCartWithNotes = (
    product: Product,
    notes: string[] = [],
    extraPrice: number = 0
  ) => {
    if (!canOrderOnline) return;

    setCart((prev) => {
      const notesKey = notes.sort().join('|');

      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          (item.notes || []).sort().join('|') === notesKey
      );

      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...prev, { product, quantity: 1, notes, extraPrice }];
    });
  };

  // Quantity Management
  const updateCartQuantity = (index: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item, idx) => {
          if (idx === index) {
            return { ...item, quantity: item.quantity + delta };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // Subtotal & Discount Math
  const subtotalAmount = cart.reduce((sum, item) => {
    const priceVal = parseFloat(formatPrice(item.product.price || (item.product as any).unit_price));
    const unitPriceWithExtras = priceVal + (item.extraPrice || 0);
    return sum + unitPriceWithExtras * item.quantity;
  }, 0);

  const couponDiscount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const loyaltyPointsToUse = redeemPoints && clientPoints >= 100 ? 100 : 0;
  const loyaltyDiscount = loyaltyPointsToUse > 0 ? 5.00 : 0;

  const totalDiscount = Math.min(subtotalAmount, couponDiscount + loyaltyDiscount);
  const finalTotalAmount = Math.max(0, subtotalAmount - totalDiscount);
  const totalItemsCount = cart.reduce((a, c) => a + c.quantity, 0);

  // Promo Code Validation Handler
  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) return;
    setIsApplyingPromo(true);
    setPromoError(null);

    try {
      const res = await fetch(`${API_BASE}/api/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          code: promoCodeInput,
          subtotal: subtotalAmount,
        }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon({ code: data.code, discount_amount: data.discount_amount });
        setPromoCodeInput('');
      } else {
        setPromoError(data.message || 'Invalid promo code.');
      }
    } catch (err) {
      setPromoError('Error validating promo code.');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  // Checkout Handler (Stripe Checkout Session)
  const handleProceedToCheckout = async () => {
    if (!canOrderOnline) {
      alert(storeStatus.closed_message || 'Online ordering is currently closed.');
      return;
    }

    if (!isLoggedIn || !accessToken) {
      setIsMobileCartOpen(false);
      setShowAuthModal(true);
      return;
    }

    setIsProcessingCheckout(true);

    try {
      const response = await fetch(`${API_BASE}/api/stripe/checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          cart: cart.map((item) => ({
            id: item.product.id,
            quantity: item.quantity,
            notes: item.notes || [],
            extraPrice: item.extraPrice || 0,
          })),
          coupon_code: appliedCoupon ? appliedCoupon.code : null,
          points_to_redeem: loyaltyPointsToUse,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.message || 'Could not launch Stripe Checkout session.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to payment provider.');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans relative">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/90 backdrop-blur sticky top-0 z-30 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
        <Link href="/" className="text-zinc-400 hover:text-white flex items-center gap-1.5 text-xs sm:text-sm font-medium">
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Home
        </Link>
        <h1 className="text-sm sm:text-lg font-black tracking-tight">Burger Palace Menu</h1>

        <div className="flex items-center gap-2 sm:gap-4">
          {isLoggedIn ? (
            <Link href="/client/profile" className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1">
              <Gift className="w-3.5 h-3.5" />
              <span>{userName || 'Account'} ({clientPoints} pts)</span>
            </Link>
          ) : (
            <Link href="/client/login" className="text-xs font-semibold text-zinc-300 hover:text-amber-400">
              Sign In
            </Link>
          )}

          {/* Cart Pill in Header */}
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm hover:bg-amber-500/20 transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Cart ({totalItemsCount})</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Left: Product Catalog */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Warning Banner when Ordering is Closed */}
          {!canOrderOnline && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl flex items-start gap-3 text-xs sm:text-sm font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-extrabold text-red-300">
                  {!storeStatus.is_store_open
                    ? 'Restaurant Temporarily Closed'
                    : !storeStatus.online_orders_enabled
                    ? 'Online Ordering Disabled'
                    : 'Outside Operating Hours'}
                </p>
                <p className="mt-1 text-red-400/90">{storeStatus.closed_message}</p>
                <p className="mt-1 text-zinc-400 text-xs flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" /> Opening Hours: {storeStatus.schedule}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search burgers, sides, drinks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Scrollable Category Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setVisibleCount(10);
                  }}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
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

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {displayedProducts.map((product) => {
              const displayPrice = formatPrice(product.price || (product as any).unit_price);
              const categoryName = product.category_name || product.category?.name;
              const optionGroups = (product as any).option_groups || (product as any).optionGroups || [];
              const hasCustomizationSteps = optionGroups.length > 0;

              return (
                <div key={product.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col justify-between group">
                  <div className="relative h-36 sm:h-44 w-full bg-zinc-800">
                    <Image
                      src={getImageUrl(product.image_path || (product as any).image)}
                      alt={product.name}
                      unoptimized
                      fill
                      className="object-cover group-hover:scale-105 transition"
                    />
                    
                    {/* Modal Details Interception Button */}
                    <Link
                      href={`/product/${product.id}`}
                      scroll={false}
                      className="absolute top-3 right-3 bg-zinc-950/80 hover:bg-zinc-800 text-amber-400 p-2 rounded-xl backdrop-blur border border-zinc-800 transition"
                      title="View Details & Allergens"
                    >
                      <Info className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {categoryName && (
                        <span className="text-[9px] sm:text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                          {categoryName}
                        </span>
                      )}
                      <div className="flex justify-between items-start mt-0.5">
                        <h3 className="font-bold text-sm sm:text-base text-white">{product.name}</h3>
                        <span className="text-amber-400 font-extrabold text-sm sm:text-base">€{displayPrice}</span>
                      </div>
                      
                      <div
                        className="text-zinc-400 text-[11px] sm:text-xs mt-1 line-clamp-2 [&_p]:m-0 [&_strong]:text-zinc-200"
                        dangerouslySetInnerHTML={{
                          __html: product.description || 'Prepared fresh on demand with premium local ingredients.',
                        }}
                      />
                    </div>
                    
                    <div className="flex gap-2 mt-3 sm:mt-4">
                      <Link
                        href={`/product/${product.id}`}
                        scroll={false}
                        className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-xl transition flex items-center justify-center shrink-0"
                        title="View Details & Allergens"
                      >
                        <Info className="w-4 h-4" />
                      </Link>

                      {/* 🚀 SMART FAST-ADD vs STEP CUSTOMIZATION BUTTON */}
                      <button
                        disabled={!canOrderOnline}
                        onClick={() => {
                          if (hasCustomizationSteps) {
                            setSelectedProductForModal(product); // Opens Dynamic Step Wizard
                          } else {
                            addToCartWithNotes(product, [], 0); // Fast 1-Click Add
                          }
                        }}
                        className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs transition disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {!canOrderOnline ? 'Closed' : hasCustomizationSteps ? 'Customize & Add' : 'Add to Order'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Pagination */}
          {visibleCount < filteredProducts.length && (
            <div className="text-center pt-4 sm:pt-6">
              <button
                onClick={() => setVisibleCount((prev) => prev + 10)}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-xs transition"
              >
                Load More ({filteredProducts.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>

        {/* Right: Desktop Cart Column */}
        <div className="hidden lg:block bg-zinc-900 border border-zinc-800 rounded-3xl p-6 h-fit sticky top-24 space-y-5">
          <h2 className="text-lg font-bold border-b border-zinc-800 pb-3">Your Order Summary</h2>
          
          {cart.length === 0 ? (
            <p className="text-zinc-500 text-center py-8 text-sm">Your order list is empty.</p>
          ) : (
            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
              {cart.map((item, index) => {
                const basePrice = parseFloat(formatPrice(item.product.price || (item.product as any).unit_price));
                const itemUnitPrice = basePrice + (item.extraPrice || 0);

                return (
                  <div key={index} className="space-y-1.5 border-b border-zinc-800/60 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-white">{item.product.name}</p>
                        <p className="text-zinc-400 text-xs">€{itemUnitPrice.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateCartQuantity(index, -1)} className="p-1 bg-zinc-800 rounded hover:bg-zinc-700">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-xs">{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(index, 1)} className="p-1 bg-zinc-800 rounded hover:bg-zinc-700">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {item.notes && item.notes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.notes.map((note) => (
                          <span key={note} className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded">
                            {note}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Promo Code Section */}
          {cart.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-500" /> Promo Code
              </label>

              {appliedCoupon ? (
                <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-xs">
                  <span className="font-bold text-emerald-400">🎟️ {appliedCoupon.code} (-€{appliedCoupon.discount_amount.toFixed(2)})</span>
                  <button onClick={() => setAppliedCoupon(null)} className="text-zinc-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. WELCOME10"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 uppercase font-mono"
                  />
                  <button
                    onClick={handleApplyPromoCode}
                    disabled={isApplyingPromo || !promoCodeInput.trim()}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-3 py-2 rounded-xl text-xs transition disabled:opacity-50"
                  >
                    {isApplyingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                  </button>
                </div>
              )}
              {promoError && <p className="text-[11px] text-red-400 font-semibold mt-1">{promoError}</p>}
            </div>
          )}

          {/* Loyalty Points Redemption Section */}
          {isLoggedIn && clientPoints >= 100 && cart.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5" /> Redeem 100 Points
                </span>
                <input
                  type="checkbox"
                  checked={redeemPoints}
                  onChange={(e) => setRedeemPoints(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-800 text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-zinc-400">Get €5.00 OFF your order using 100 points (Balance: {clientPoints} pts).</p>
            </div>
          )}

          {/* Totals Breakdown */}
          <div className="border-t border-zinc-800 pt-3 space-y-3">
            <div className="space-y-1 text-xs text-zinc-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>€{subtotalAmount.toFixed(2)}</span>
              </div>

              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Discounts &amp; Rewards</span>
                  <span>-€{totalDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between font-black text-lg border-t border-zinc-800 pt-2">
              <span>Total TTC</span>
              <span className="text-amber-400">€{finalTotalAmount.toFixed(2)}</span>
            </div>

            <button
              disabled={cart.length === 0 || isProcessingCheckout || !canOrderOnline}
              onClick={handleProceedToCheckout}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm transition disabled:cursor-not-allowed"
            >
              {!canOrderOnline ? (
                'Ordering Closed'
              ) : isProcessingCheckout ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Proceed to Stripe Checkout'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Cart Button for Mobile */}
      {totalItemsCount > 0 && (
        <button
          onClick={() => setIsMobileCartOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-40 bg-amber-500 hover:bg-amber-400 text-zinc-950 p-4 rounded-full shadow-2xl flex items-center justify-center transition transform active:scale-95"
          aria-label="View Order Details"
        >
          <ShoppingBag className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-zinc-950 text-amber-400 font-black text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-amber-500">
            {totalItemsCount}
          </span>
        </button>
      )}

      {/* Mobile Cart Drawer */}
      {isMobileCartOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end lg:hidden animate-in fade-in duration-200">
          <div className="bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-5 sm:p-6 space-y-5 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  Your Order Details ({totalItemsCount})
                </h2>
              </div>
              <button
                onClick={() => setIsMobileCartOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {cart.length === 0 ? (
                <p className="text-zinc-500 text-center py-8 text-sm">Your order list is empty.</p>
              ) : (
                cart.map((item, index) => {
                  const basePrice = parseFloat(formatPrice(item.product.price || (item.product as any).unit_price));
                  const itemUnitPrice = basePrice + (item.extraPrice || 0);

                  return (
                    <div
                      key={index}
                      className="bg-zinc-950 border border-zinc-800/80 p-3.5 rounded-2xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="pr-2 min-w-0">
                          <p className="font-bold text-sm text-white truncate">{item.product.name}</p>
                          <p className="text-amber-400 text-xs font-semibold mt-0.5">€{itemUnitPrice.toFixed(2)} each</p>
                        </div>

                        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl shrink-0">
                          <button
                            onClick={() => updateCartQuantity(index, -1)}
                            className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-extrabold text-xs px-1.5">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(index, 1)}
                            className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {item.notes && item.notes.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1.5 border-t border-zinc-900">
                          {item.notes.map((note) => (
                            <span key={note} className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {note}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Mobile Promo Code & Loyalty Controls */}
            {cart.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Promo Code"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono"
                  />
                  <button
                    onClick={handleApplyPromoCode}
                    className="bg-amber-500 text-zinc-950 font-bold px-3 py-2 rounded-xl text-xs"
                  >
                    Apply
                  </button>
                </div>

                {isLoggedIn && clientPoints >= 100 && (
                  <div className="flex justify-between items-center text-xs bg-amber-500/10 p-2.5 rounded-xl text-amber-400 font-bold">
                    <span>🎁 Redeem 100 Points (€5 OFF)</span>
                    <input
                      type="checkbox"
                      checked={redeemPoints}
                      onChange={(e) => setRedeemPoints(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-zinc-800 pt-4 space-y-4">
              <div className="flex justify-between items-center font-black text-lg">
                <span className="text-white">Total Amount:</span>
                <span className="text-amber-400 text-xl">€{finalTotalAmount.toFixed(2)}</span>
              </div>

              {!canOrderOnline && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-semibold">
                  🔴 {storeStatus.closed_message}
                </div>
              )}

              <button
                disabled={cart.length === 0 || isProcessingCheckout || !canOrderOnline}
                onClick={handleProceedToCheckout}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm transition disabled:cursor-not-allowed"
              >
                {!canOrderOnline ? (
                  'Ordering Closed'
                ) : isProcessingCheckout ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Proceed to Stripe Checkout'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-zinc-500">
              <X className="w-5 h-5" />
            </button>
            <Lock className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h3 className="text-xl font-extrabold">Login Required</h3>
            <p className="text-zinc-400 text-xs mt-2">Please sign in to place a Click &amp; Collect order.</p>
            <button
              onClick={() => router.push('/client/login')}
              className="w-full bg-amber-500 text-zinc-950 font-bold py-3 rounded-xl text-sm mt-6"
            >
              Sign In Now
            </button>
          </div>
        </div>
      )}

      {/* Unified Dynamic Step Customizer Modal */}
      {selectedProductForModal && (
        <ProductStepModal
          product={selectedProductForModal}
          onClose={() => setSelectedProductForModal(null)}
          onConfirm={(product, notes, extraPrice) => {
            addToCartWithNotes(product, notes, extraPrice);
            setSelectedProductForModal(null);
          }}
        />
      )}
    </div>
  );
}
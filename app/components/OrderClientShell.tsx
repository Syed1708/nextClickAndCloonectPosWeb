'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Plus, Minus, ArrowLeft, Search, Loader2, Lock, X } from 'lucide-react';
import { Product } from '../types';
import { getImageUrl, formatPrice } from '../lib/api';

interface OrderClientShellProps {
  initialProducts: Product[];
  isLoggedIn: boolean;
  accessToken: string | null;
  userName: string | null;
}

export default function OrderClientShell({
  initialProducts,
  isLoggedIn,
  accessToken,
  userName,
}: OrderClientShellProps) {
  const router = useRouter();

  const [products] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  
  // Search & Category Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [visibleCount, setVisibleCount] = useState(10);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Dynamic Categories from Server Data
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category_name || 'Burgers')))];

  // Filter Products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || (product.category_name || 'Burgers') === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const displayedProducts = filteredProducts.slice(0, visibleCount);

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

  const totalAmount = cart.reduce((sum, item) => {
    const priceVal = parseFloat(formatPrice(item.product.price || (item.product as any).unit_price));
    return sum + priceVal * item.quantity;
  }, 0);

  // CHECKOUT USING SERVER-PASSED AUTH PROPS
 const handleProceedToCheckout = async () => {
    if (!isLoggedIn || !accessToken) {
      setShowAuthModal(true);
      return;
    }

    setIsProcessingCheckout(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/stripe/checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`, // Sanctum Client Token
          },
          body: JSON.stringify({
            // 🚀 FIX: Sending 'cart' instead of 'items' to match Laravel validation!
            cart: cart.map((item) => ({
              id: item.product.id,
              quantity: item.quantity,
            })),
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect directly to Stripe's secure checkout URL
        window.location.href = data.url;
      } else {
        alert(data.error || data.message || 'Could not launch Stripe payment session');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('An error occurred connecting to payment service');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-zinc-400 hover:text-white flex items-center gap-2 text-sm font-medium">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </Link>
        <h1 className="text-lg font-extrabold tracking-tight">Burger Palace Menu</h1>
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Link href="/profile" className="text-xs font-bold text-amber-400 hover:underline">
              Welcome, {userName || 'Account'}
            </Link>
          ) : (
            <Link href="/login" className="text-xs font-semibold text-zinc-300 hover:text-amber-400">
              Sign In
            </Link>
          )}

          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-full font-semibold text-sm">
            <ShoppingBag className="w-4 h-4" />
            <span>Cart ({cart.reduce((a, c) => a + c.quantity, 0)})</span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Menu Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search burgers, sides, drinks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Category Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setVisibleCount(10);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
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

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayedProducts.map((product) => {
              const displayPrice = formatPrice(product.price || (product as any).unit_price);

              return (
                <div key={product.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col justify-between">
                  <div className="relative h-44 w-full bg-zinc-800">
                    <Image src={getImageUrl(product.image)} alt={product.name} fill className="object-cover" />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {product.category_name && (
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                          {product.category_name}
                        </span>
                      )}
                      <div className="flex justify-between items-start mt-0.5">
                        <h3 className="font-bold text-base text-white">{product.name}</h3>
                        <span className="text-amber-400 font-extrabold text-base">€{displayPrice}</span>
                      </div>
                      <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{product.description || 'Prepared fresh on demand.'}</p>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="mt-4 w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs transition"
                    >
                      <Plus className="w-4 h-4" /> Add to Order
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Load More */}
          {visibleCount < filteredProducts.length && (
            <div className="text-center pt-6">
              <button
                onClick={() => setVisibleCount((prev) => prev + 10)}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-8 py-3 rounded-xl font-bold text-xs transition"
              >
                Load More Products ({filteredProducts.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>

        {/* Order Summary & Stripe Button */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 h-fit sticky top-24 space-y-6">
          <h2 className="text-lg font-bold border-b border-zinc-800 pb-3">Your Order</h2>
          {cart.length === 0 ? (
            <p className="text-zinc-500 text-center py-8 text-sm">Your order list is empty.</p>
          ) : (
            <div className="space-y-4 max-h-75 overflow-y-auto pr-2">
              {cart.map((item) => {
                const itemPrice = formatPrice(item.product.price || (item.product as any).unit_price);
                return (
                  <div key={item.product.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-white">{item.product.name}</p>
                      <p className="text-zinc-400 text-xs">€{itemPrice} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeFromCart(item.product.id)} className="p-1 bg-zinc-800 rounded hover:bg-zinc-700">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-xs">{item.quantity}</span>
                      <button onClick={() => addToCart(item.product)} className="p-1 bg-zinc-800 rounded hover:bg-zinc-700">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-zinc-800 pt-4 space-y-4">
            <div className="flex justify-between font-bold text-lg">
              <span>Total Amount:</span>
              <span className="text-amber-400">€{totalAmount.toFixed(2)}</span>
            </div>

            <button
              disabled={cart.length === 0 || isProcessingCheckout}
              onClick={handleProceedToCheckout}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 text-zinc-950 font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm transition"
            >
              {isProcessingCheckout ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Proceed to Stripe Checkout'}
            </button>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-sm w-full text-center relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <Lock className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h3 className="text-xl font-extrabold">Login Required</h3>
            <p className="text-zinc-400 text-xs mt-2">Please sign in to your customer account to complete payment.</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-amber-500 text-zinc-950 font-bold py-3 rounded-xl text-sm mt-6"
            >
              Sign In Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
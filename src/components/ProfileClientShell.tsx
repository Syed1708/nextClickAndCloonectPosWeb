'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Session } from 'next-auth';
import Link from 'next/link';
import RealtimeTracker from '../components/RealtimeTracker';
import CustomerReservationsTab from '../components/client/CustomerReservationsTab'; // 🚀 Import Reservations Tab
import {
  ShoppingBag,
  User as UserIcon,
  Clock,
  LogOut,
  ArrowLeft,
  Save,
  MapPin,
  Phone,
  Mail,
  Check,
  Loader2,
  Armchair, // 🚀 Import Armchair Icon
} from 'lucide-react';
import { ClientProfile, Order } from '../types';

interface ClientDashboardShellProps {
  session: Session | null;
  clientProfile: ClientProfile | any | null;
  initialOrders: Order[];
}

export default function ClientDashboardShell({
  session,
  clientProfile,
  initialOrders,
}: ClientDashboardShellProps) {
  const router = useRouter();
  
  // 🚀 1. Add 'reservations' to activeTab state!
  const [activeTab, setActiveTab] = useState<'tracker' | 'orders' | 'reservations' | 'profile'>('tracker');

  // Initialize form with FRESH MySQL data
  const [profileData, setProfileData] = useState({
    name: clientProfile?.name || session?.user?.name || '',
    email: clientProfile?.email || session?.user?.email || '',
    phone: clientProfile?.phone || '',
    address: clientProfile?.address || '12 Rue Sainte-Catherine, 33000 Bordeaux',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);





  // 🚀 Local Orders State
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [prevInitialOrders, setPrevInitialOrders] = useState<Order[]>(initialOrders);

  // 🚀 REACT 19 COMPLIANT PROP SYNC: Updates state during render without useEffect!
  if (prevInitialOrders !== initialOrders) {
    setPrevInitialOrders(initialOrders);
    setOrders(initialOrders);
  }

  // 🚀 2. Instant Order Verification & Real-Time State Injection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const sessionId = urlParams.get('session_id');

    if (status === 'success' && sessionId) {
      const verifyAndCreateOrder = async () => {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/checkout/verify-session?session_id=${sessionId}`
          );

          if (res.ok) {
            const data = await res.json();

            // 🚀 INSTANT STATE UPDATE: Add new order directly to state without waiting for refresh!
            if (data.order) {
              setOrders((prev) => {
                const exists = prev.some((o) => o.id === data.order.id || o.uuid === data.order.uuid);
                if (exists) return prev;
                return [data.order, ...prev]; // Appends new order to the top of the list
              });
            }

            // Clean query parameters from URL address bar
            router.replace('/client/profile');
            router.refresh();
          }
        } catch (err) {
          console.error('Session verification error:', err);
        }
      };

      verifyAndCreateOrder();
    }
  }, [router]);
  
  // Filters active orders using preparation_status
  const activeOrders = orders.filter((o) => {
    const prepStatus = o.preparation_status || 'pending';
    return prepStatus !== 'delivered' && prepStatus !== 'cancelled';
  });

  const handleSaveProfile = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const token = (session as any)?.accessToken;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/client/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: profileData.name,
            phone: profileData.phone,
            address: profileData.address,
          }),
        }
      );

      if (res.ok) {
        setSavedSuccess(true);
        router.refresh();
        setTimeout(() => setSavedSuccess(false), 3500);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-400 hover:text-white flex items-center gap-2 text-sm font-medium">
              <ArrowLeft className="w-5 h-5" /> Home
            </Link>
            <span className="text-zinc-700">|</span>
            <span className="text-lg font-black tracking-tight">Customer Portal</span>
          </div>

          <div className="flex items-center gap-3">
            {/* 🚀 NEW: Book Table Header Button */}
            <Link
              href="/reservation"
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs px-4 py-2.5 rounded-full flex items-center gap-2 transition"
            >
              <Armchair className="w-4 h-4 text-amber-500" /> Book Table
            </Link>

            <Link
              href="/order"
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs px-4 py-2.5 rounded-full flex items-center gap-2 transition"
            >
              <ShoppingBag className="w-4 h-4" /> Order Online
            </Link>
            
            <button
              onClick={() => signOut({ callbackUrl: '/client/login' })}
              className="bg-zinc-900 hover:bg-red-500/10 hover:text-red-400 border border-zinc-800 text-zinc-400 px-4 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center font-bold text-lg">
                {(profileData.name || session?.user?.name)?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-extrabold text-base">{profileData.name || session?.user?.name}</h2>
                <p className="text-zinc-500 text-xs truncate max-w-37.5">{profileData.email}</p>
              </div>
            </div>

            <nav className="space-y-2 pt-2 border-t border-zinc-800/80">
              <button
                onClick={() => setActiveTab('tracker')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                  activeTab === 'tracker'
                    ? 'bg-amber-500 text-zinc-950'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4" /> Live Tracking ({activeOrders.length})
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                  activeTab === 'orders'
                    ? 'bg-amber-500 text-zinc-950'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4" /> Order History ({orders.length})
              </button>

              {/* 🚀 2. NEW: Table Bookings Tab */}
              <button
                onClick={() => setActiveTab('reservations')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                  activeTab === 'reservations'
                    ? 'bg-amber-500 text-zinc-950'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <Armchair className="w-4 h-4" /> Table Bookings
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                  activeTab === 'profile'
                    ? 'bg-amber-500 text-zinc-950'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <UserIcon className="w-4 h-4" /> Account Settings
              </button>
            </nav>
          </div>
        </aside>

        {/* Tab Content */}
        <section className="lg:col-span-3 space-y-6">
          {activeTab === 'tracker' && (
            <div className="space-y-6">
              <h2 className="text-xl font-extrabold tracking-tight">Active Live Orders ({activeOrders.length})</h2>
              {activeOrders.length > 0 ? (
                activeOrders.map((order) => (
                  <RealtimeTracker key={order.id} initialOrder={order} />
                ))
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center space-y-3">
                  <Clock className="w-10 h-10 text-zinc-600 mx-auto" />
                  <h3 className="font-bold text-lg text-white">No Active Orders</h3>
                  <Link
                    href="/order"
                    className="inline-block bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs px-6 py-3 rounded-xl transition mt-2"
                  >
                    Place Click &amp; Collect Order
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-xl font-extrabold tracking-tight">Order History ({orders.length})</h2>
              <div className="space-y-4">
                {orders.map((order: Order) => (
                  <div key={order.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
                    <div className="flex justify-between items-center text-sm border-b border-zinc-800 pb-3">
                      <div>
                        <span className="font-extrabold text-white text-base">Order #{order.sequence_number || order.id}</span>
                        <span className="text-zinc-500 text-xs block mt-0.5">{new Date(order.created_at).toLocaleString()}</span>
                      </div>
                      <span className="text-amber-400 font-extrabold text-lg">€{Number(order.total_incl_vat || order.total_amount || 0).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">Preparation Status:</span>
                      <span className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full font-bold capitalize">
                        {order.preparation_status || order.status || 'pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🚀 3. NEW: Table Bookings Tab Content */}
          {activeTab === 'reservations' && (
            <CustomerReservationsTab accessToken={(session as any)?.accessToken || null} />
          )}

          {activeTab === 'profile' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">Account Settings</h2>
                <p className="text-zinc-400 text-xs mt-1">Update your default information</p>
              </div>

              {savedSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl text-xs flex items-center gap-2 font-semibold">
                  <Check className="w-4 h-4" /> Profile updated successfully!
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Full Name</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        required
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-amber-500 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="email"
                        disabled
                        value={profileData.email}
                        className="w-full bg-zinc-950/50 border border-zinc-800 text-zinc-500 rounded-xl pl-10 pr-4 py-3 text-sm cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-amber-500 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Delivery Address</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        value={profileData.address}
                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-amber-500 focus:outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-2 transition disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Profile Changes
                </button>
              </form>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
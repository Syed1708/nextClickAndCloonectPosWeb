'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Users,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Armchair,
  Lock,
  Clock,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface ReservationClientShellProps {
  isLoggedIn: boolean;
  accessToken: string | null;
  user: {
    name: string;
    email: string;
    phone: string;
  };
}

export default function ReservationClientShell({
  isLoggedIn,
  accessToken,
  user,
}: ReservationClientShellProps) {
  const router = useRouter();
  const todayLocalStr = new Date().toLocaleDateString('en-CA');

  const [formData, setFormData] = useState({
    customer_name: user.name || '',
    customer_phone: user.phone || '',
    customer_email: user.email || '',
    guest_count: 2,
    reservation_date: todayLocalStr,
    reservation_time: '19:30',
    zone: 'indoor', // 'indoor', 'terrace', 'vip'
    special_notes: '',
  });

  const [storeStatus, setStoreStatus] = useState<{
    is_open: boolean;
    is_store_open: boolean;
    reservations_enabled: boolean;
    schedule: string;
    closed_message: string;
  }>({
    is_open: true,
    is_store_open: true,
    reservations_enabled: true,
    schedule: '10:00 - 14:30 & 18:30 - 22:30',
    closed_message: 'Restaurant is currently closed for reservations.',
  });

  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  // 1. Fetch Store Status on Load
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch(`${API_BASE}/api/store-status`);
        if (res.ok) {
          const data = await res.json();
          setStoreStatus(data);
        }
      } catch (err) {
        console.error('Failed to fetch store status:', err);
      }
    }
    checkStatus();
  }, [API_BASE]);

  // 2. Real-Time Table Availability Check
  useEffect(() => {
    async function checkAvailability() {
      if (!formData.reservation_date || !formData.reservation_time) return;

      setIsCheckingAvailability(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/reservations/availability?date=${formData.reservation_date}&time=${formData.reservation_time}&guests=${formData.guest_count}&zone=${formData.zone}`
        );
        if (res.ok) {
          const data = await res.json();
          setIsAvailable(data.is_available);
        }
      } catch (err) {
        setIsAvailable(null);
      } finally {
        setIsCheckingAvailability(false);
      }
    }

    const timer = setTimeout(checkAvailability, 400);
    return () => clearTimeout(timer);
  }, [API_BASE, formData.reservation_date, formData.reservation_time, formData.guest_count, formData.zone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🛑 Block if not logged in
    if (!isLoggedIn) {
      router.push('/client/login?callbackUrl=/reservation');
      return;
    }

    if (!storeStatus.is_store_open || !storeStatus.reservations_enabled) {
      setStatusMessage({
        type: 'error',
        text: storeStatus.closed_message || 'Table reservations are currently disabled.',
      });
      return;
    }

    if (isAvailable === false) {
      setStatusMessage({
        type: 'error',
        text: 'No tables available for this time. Please select another time slot.',
      });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`${API_BASE}/api/reservations/online`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: `Table reserved successfully for ${formData.guest_count} guests on ${formData.reservation_date} at ${formData.reservation_time}!`,
        });
        setFormData((prev) => ({ ...prev, special_notes: '' }));
      } else {
        setStatusMessage({
          type: 'error',
          text: data.message || 'Failed to process table reservation.',
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Network error submitting table reservation.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 🚀 FIX: Block form ONLY if Admin manually disabled reservations or turned off store master status
const isFormBlocked = !storeStatus.is_store_open || !storeStatus.reservations_enabled;

  return (
    <div className="h-screen w-screen bg-zinc-950 text-white p-4 sm:p-6 lg:p-8  mx-auto font-sans space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
        <Link href="/" className="text-zinc-400 hover:text-white flex items-center gap-2 text-sm font-medium transition">
          <ArrowLeft className="w-4 h-4" /> Return to Home
        </Link>
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Link href="/client/profile" className="text-xs font-black text-amber-400 hover:underline">
              My Profile &amp; Bookings
            </Link>
          ) : (
            <Link href="/client/login?callbackUrl=/reservation" className="text-xs font-bold text-zinc-300 hover:text-amber-400">
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* 🚀 DESKTOP 2-COLUMN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: HERO & RESTAURANT HIGHLIGHTS (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2 text-amber-500 font-extrabold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Premium Dining Experience
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              Reserve Your Table at Burger Palace
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Experience hand-crafted gourmet burgers, local Bordeaux ingredients, and premium atmosphere. Book your table in advance for indoor room, outdoor terrace, or VIP lounge seating.
            </p>

            {/* Operating Schedule Badge */}
            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Daily Operating Hours</p>
                <p className="text-xs text-zinc-400 mt-0.5">{storeStatus.schedule}</p>
              </div>
            </div>

            {/* Features List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-xl text-center">
                <p className="text-amber-400 font-black text-sm">🏠 Indoor Room</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Cozy &amp; Climate Controlled</p>
              </div>
              <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-xl text-center">
                <p className="text-amber-400 font-black text-sm">☀️ Outdoor Terrace</p>

                <p className="text-[10px] text-zinc-400 mt-0.5">Fresh Air &amp; City View</p>
              </div>
              <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-xl text-center">
                <p className="text-amber-400 font-black text-sm">⭐ VIP Lounge</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Private Group Dining</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: BOOKING FORM CARD (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
          
          {/* 🔒 LOGIN REQUIRED OVERLAY FOR GUESTS */}
          {!isLoggedIn ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-500">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">Sign In Required</h2>
                <p className="text-xs text-zinc-400 mt-2">
                  Please sign in to your customer account to reserve a table online.
                </p>
              </div>
              <button
                onClick={() => router.push('/client/login?callbackUrl=/reservation')}
                className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black py-4 rounded-2xl text-xs transition active:scale-95"
              >
                Sign In to Reserve Table
              </button>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <Armchair className="w-5 h-5 text-amber-500" /> Book Table Online
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Logged in as <strong className="text-white">{user.name || user.email}</strong>
                </p>
              </div>

              {/* Warning Banner when Closed / Disabled */}
              {isFormBlocked && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl flex items-start gap-3 text-xs font-semibold">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-red-300">Reservations Closed</p>
                    <p className="mt-0.5 text-red-400/90">{storeStatus.closed_message}</p>
                  </div>
                </div>
              )}

              {/* Status Message */}
              {statusMessage && (
                <div
                  className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold border ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Contact Inputs */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Your Name *</label>
                    <input
                      type="text"
                      required
                      disabled={isFormBlocked}
                      placeholder="e.g. John Doe"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Phone Number *</label>
                    <input
                      type="text"
                      required
                      disabled={isFormBlocked}
                      placeholder="e.g. +33612345678"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Date, Time, Guests */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Date *</label>
                    <input
                      type="date"
                      required
                      min={todayLocalStr} // 🚀 Disables past calendar dates
                      disabled={isFormBlocked}
                      value={formData.reservation_date}
                      onChange={(e) => setFormData({ ...formData, reservation_date: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Time *</label>
                    <input
                      type="time"
                      required
                      disabled={isFormBlocked}
                      value={formData.reservation_time}
                      onChange={(e) => setFormData({ ...formData, reservation_time: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Guest Count *</label>
                  <select
                    disabled={isFormBlocked}
                    value={formData.guest_count}
                    onChange={(e) => setFormData({ ...formData, guest_count: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dining Zone Preference */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1.5">Dining Zone</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'indoor', label: '🏠 Indoor' },
                      { id: 'terrace', label: '☀️ Terrace' },
                      { id: 'vip', label: '⭐ VIP' },
                    ].map((z) => (
                      <button
                        key={z.id}
                        type="button"
                        disabled={isFormBlocked}
                        onClick={() => setFormData({ ...formData, zone: z.id })}
                        className={`py-2 rounded-xl text-[11px] font-bold transition border ${
                          formData.zone === z.id
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        {z.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Real-time Availability Badge */}
                {isCheckingAvailability ? (
                  <div className="flex items-center gap-2 text-xs text-zinc-400 py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                    <span>Checking table availability...</span>
                  </div>
                ) : isAvailable === true ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Tables Available!
                  </div>
                ) : isAvailable === false ? (
                  <div className="flex items-center gap-2 text-xs text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-500" /> Fully booked for this time slot.
                  </div>
                ) : null}

                {/* Special Notes */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Special Notes (Optional)</label>
                  <textarea
                    rows={2}
                    disabled={isFormBlocked}
                    placeholder="e.g. High chair needed, terrace preferred..."
                    value={formData.special_notes}
                    onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isFormBlocked || submitting || isAvailable === false}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black py-4 rounded-2xl text-xs transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Confirming Reservation...
                    </>
                  ) : isFormBlocked ? (
                    'Reservations Closed'
                  ) : (
                    'Confirm Table Reservation'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
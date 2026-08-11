'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Users, ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function CustomerReservationPage() {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    guest_count: 2,
    reservation_date: new Date().toISOString().split('T')[0],
    reservation_time: '19:30',
    special_notes: '',
  });

  const [storeStatus, setStoreStatus] = useState<{
    is_open: boolean;
    reservations_enabled: boolean;
    schedule: string;
    closed_message: string;
  }>({
    is_open: true,
    reservations_enabled: true,
    schedule: '10:00 - 14:30 & 18:30 - 22:30',
    closed_message: 'Restaurant is currently closed for reservations.',
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  // Fetch Global Store Status on Load
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!storeStatus.is_open || !storeStatus.reservations_enabled) {
      setStatusMessage({
        type: 'error',
        text: storeStatus.closed_message || 'Table reservations are currently disabled.',
      });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`${API_BASE}/api/reservations/online`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: `Reservation confirmed for ${formData.guest_count} guests on ${formData.reservation_date} at ${formData.reservation_time}!`,
        });
        setFormData((prev) => ({ ...prev, special_notes: '' }));
      } else {
        setStatusMessage({
          type: 'error',
          text: data.message || 'Failed to complete reservation.',
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Network error connecting to booking service.',
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormBlocked = !storeStatus.is_open || !storeStatus.reservations_enabled;
  const todayDateStr = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 flex flex-col justify-between max-w-3xl mx-auto font-sans">
      <div>
        {/* Header Nav */}
        <div className="flex items-center justify-between pb-6 border-b border-zinc-800 mb-6">
          <Link href="/" className="text-zinc-400 hover:text-white flex items-center gap-2 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <h1 className="text-lg font-black text-white">Burger Palace Bordeaux</h1>
        </div>

        {/* Warning Banner when Closed / Disabled */}
        {isFormBlocked && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl mb-6 flex items-start gap-3 text-xs sm:text-sm font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-extrabold text-red-300">Reservations Currently Closed</p>
              <p className="mt-1 text-red-400/90">{storeStatus.closed_message}</p>
              <p className="mt-1 text-zinc-400 text-xs">Opening Hours: {storeStatus.schedule}</p>
            </div>
          </div>
        )}

        {/* Status Notification Message */}
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl mb-6 flex items-center gap-3 text-xs sm:text-sm font-bold border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Reservation Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-amber-500" /> Reserve a Table
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Select date, time, and guest count. Hours: {storeStatus.schedule}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Contact Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  disabled={isFormBlocked}
                  placeholder="e.g. John Doe"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  disabled={isFormBlocked}
                  placeholder="e.g. +33612345678"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Date, Time, Guests */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Booking Date *</label>
                <input
                  type="date"
                  required
                  min={todayDateStr} // 🚀 Blocks past calendar dates
                  disabled={isFormBlocked}
                  value={formData.reservation_date}
                  onChange={(e) => setFormData({ ...formData, reservation_date: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Booking Time *</label>
                <input
                  type="time"
                  required
                  disabled={isFormBlocked}
                  value={formData.reservation_time}
                  onChange={(e) => setFormData({ ...formData, reservation_time: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Guests *</label>
                <select
                  disabled={isFormBlocked}
                  value={formData.guest_count}
                  onChange={(e) => setFormData({ ...formData, guest_count: Number(e.target.value) })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label className="text-xs font-bold text-zinc-400 block mb-1">Special Requests (Optional)</label>
              <textarea
                rows={2}
                disabled={isFormBlocked}
                placeholder="e.g. Birthday dinner, terrace seating preferred..."
                value={formData.special_notes}
                onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isFormBlocked || loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black py-4 rounded-2xl text-xs transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Confirming Reservation...
                </>
              ) : isFormBlocked ? (
                'Reservations Currently Closed'
              ) : (
                'Confirm Table Reservation'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
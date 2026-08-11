'use client';

import { useState, useEffect, useCallback } from 'react';
import { Armchair, Calendar, Clock, Phone, Users, XCircle, Loader2 } from 'lucide-react';

interface Reservation {
  id: number;
  customer_name: string;
  customer_phone: string;
  guest_count: number;
  reservation_date: string;
  reservation_time: string;
  status: 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  special_notes?: string;
  table?: { table_number: string; zone: string };
}

export default function CustomerReservationsTab({ accessToken }: { accessToken: string | null }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  const fetchMyReservations = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/client/reservations`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setReservations(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching client reservations:', err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, accessToken]);

  useEffect(() => {
    fetchMyReservations();
  }, [fetchMyReservations]);

  const handleCancelBooking = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/client/reservations/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (res.ok) {
        fetchMyReservations();
      }
    } catch (err) {
      alert('Error cancelling reservation.');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
        <Armchair className="w-5 h-5 text-amber-500" /> My Table Bookings
      </h3>

      {loading ? (
        <div className="py-12 text-center text-zinc-500 flex flex-col items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
          <span className="text-xs">Loading your bookings...</span>
        </div>
      ) : reservations.length === 0 ? (
        <div className="py-12 text-center bg-zinc-900 border border-dashed border-zinc-800 rounded-2xl space-y-2">
          <Calendar className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-zinc-400 text-xs font-bold">You have no table reservations yet.</p>
        </div>
      ) : (
        reservations.map((res) => {
          const isSeated = res.status === 'seated';
          const isConfirmed = res.status === 'confirmed';

          return (
            <div
              key={res.id}
              className={`bg-zinc-900 border ${
                isSeated
                  ? 'border-red-500/50 bg-red-950/10'
                  : isConfirmed
                  ? 'border-amber-500/30'
                  : 'border-zinc-800'
              } p-4 rounded-2xl space-y-3`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-sm font-black text-white">{res.customer_name}</span>
                  <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Calendar className="w-3.5 h-3.5" /> {res.reservation_date}
                    </span>
                    <span className="flex items-center gap-1 font-bold">
                      <Clock className="w-3.5 h-3.5 text-amber-500" /> {res.reservation_time}
                    </span>
                    <span className="flex items-center gap-1 font-bold">
                      <Users className="w-3.5 h-3.5 text-zinc-400" /> {res.guest_count} Guests
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    isSeated
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : isConfirmed
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {res.status}
                </span>
              </div>

              {res.table && (
                <div className="bg-zinc-950 border border-zinc-800 p-2 rounded-xl text-xs flex justify-between items-center text-zinc-300 font-bold">
                  <span>🍽️ Table Assigned: {res.table.table_number}</span>
                  <span className="uppercase text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                    {res.table.zone}
                  </span>
                </div>
              )}

              {isConfirmed && (
                <div className="pt-2 border-t border-zinc-800 flex justify-end">
                  <button
                    onClick={() => handleCancelBooking(res.id)}
                    className="text-xs text-red-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel Reservation
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
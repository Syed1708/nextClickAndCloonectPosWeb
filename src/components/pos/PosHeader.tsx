'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  RefreshCw,
  History,
  Receipt,
  LogOut,
  Armchair,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface PosHeaderProps {
  cashierName: string;
  cashierRole: string;
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncing: boolean;
  unpaidKioskCount?: number;             // 🚀 Added
  onTriggerSync: () => void;
  onOpenSalesHistory: () => void;
  onOpenZClosure: () => void;
  onOpenUnpaidKioskModal?: () => void;   // 🚀 Added
}

export default function PosHeader({
  cashierName,
  cashierRole,
  isOnline,
  pendingSyncCount,
  isSyncing,
  unpaidKioskCount = 0,
  onTriggerSync,
  onOpenSalesHistory,
  onOpenZClosure,
  onOpenUnpaidKioskModal,
}: PosHeaderProps) {
  return (
    <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-3.5 flex items-center justify-between shrink-0">
      {/* Left: Store Name & Network Status */}
      <div className="flex items-center gap-4">
        <h1 className="font-black text-lg text-white tracking-tight">Burger Palace POS</h1>
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isOnline
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
        >
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Center: Cashier Info */}
      <div className="text-center hidden md:block">
        <p className="text-xs font-bold text-white">{cashierName}</p>
        <p className="text-[10px] text-amber-500 font-semibold">{cashierRole}</p>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2">


        {/* 🚀 ALWAYS-VISIBLE SYNC BUTTON */}
        <button
          onClick={onTriggerSync}
          disabled={isSyncing || !isOnline}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${pendingSyncCount > 0
              ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black animate-pulse'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          title="Sync Offline Orders"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>Sync {pendingSyncCount > 0 ? `(${pendingSyncCount})` : ''}</span>
        </button>

        {/* 🚀 UNPAID KIOSK ORDERS NOTIFICATION BUTTON */}
        {onOpenUnpaidKioskModal && (
          <button
            onClick={onOpenUnpaidKioskModal}
            className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition relative"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Unpaid Kiosk</span>
            {unpaidKioskCount > 0 && (
              <span className="bg-amber-500 text-zinc-950 font-black text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                {unpaidKioskCount}
              </span>
            )}
          </button>
        )}

        {/* Reservations Link */}
        <Link
          href="/pos/reservations"
          className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl text-xs font-bold transition"
        >
          <Armchair className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Reservations</span>
        </Link>

        {/* Sales & Refunds */}
        <button
          onClick={onOpenSalesHistory}
          className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl text-xs font-bold transition"
        >
          <History className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Sales &amp; Refund</span>
        </button>

        {/* Z-Closure */}
        <button
          onClick={onOpenZClosure}
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
  );
}
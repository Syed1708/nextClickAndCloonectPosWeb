'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { ArrowLeft, RefreshCw, History, Receipt, LogOut, Armchair } from 'lucide-react';

interface PosHeaderProps {
  cashierName: string;
  cashierRole: string;
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncing: boolean;
  onTriggerSync: () => void;
  onOpenSalesHistory: () => void;
  onOpenZClosure: () => void;
}

export default function PosHeader({
  cashierName,
  cashierRole,
  isOnline,
  pendingSyncCount,
  isSyncing,
  onTriggerSync,
  onOpenSalesHistory,
  onOpenZClosure,
}: PosHeaderProps) {
  return (
    <header className="bg-zinc-900 border-b border-zinc-800 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-400 hover:text-white transition"
          title="Back to site"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            POS Terminal
          </h1>
          <p className="text-[11px] text-zinc-400">
            {cashierName} ({cashierRole})
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {pendingSyncCount > 0 && (
          <button
            onClick={onTriggerSync}
            disabled={isSyncing || !isOnline}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-3 py-1.5 rounded-xl text-xs font-black transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync ({pendingSyncCount})</span>
          </button>
        )}

          {/* 🚀 NEW: RESERVATIONS LINK BUTTON */}
  <Link
    href="/pos/reservations"
    className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl text-xs font-bold transition"
  >
    <Armchair className="w-3.5 h-3.5 text-amber-500" />
    <span className="hidden sm:inline">Reservations</span>
  </Link>

        <button
          onClick={onOpenSalesHistory}
          className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl text-xs font-bold transition"
        >
          <History className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Sales & Refund</span>
        </button>

        <button
          onClick={onOpenZClosure}
          className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl text-xs font-bold transition"
        >
          <Receipt className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Z-Closure</span>
        </button>

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
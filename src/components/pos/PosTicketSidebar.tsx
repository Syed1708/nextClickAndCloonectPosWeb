'use client';

import { Product } from '@/types';
import { formatPrice } from '@/lib/api';
import {
  RotateCcw,
  ShoppingBag,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  User,
  Phone,
  Split,
  AlertTriangle,
} from 'lucide-react';

interface PosCartItem {
  product: Product;
  quantity: number;
  notes?: string[];
  extraPrice?: number;
}

interface PosTicketSidebarProps {
  cart: PosCartItem[];
  orderType: 'dine_in' | 'takeaway';
  paymentMethod: 'cash' | 'card' | 'split';
  cashGiven: string;
  splitCashAmount: string;
  customerName: string;
  customerPhone: string;
  isSubmitting: boolean;
  onSetOrderType: (type: 'dine_in' | 'takeaway') => void;
  onSetPaymentMethod: (method: 'cash' | 'card' | 'split') => void;
  onSetCashGiven: (value: string) => void;
  onSetSplitCashAmount: (value: string) => void;
  onSetCustomerName: (value: string) => void;
  onSetCustomerPhone: (value: string) => void;
  onAddToCart: (product: Product, notes?: string[], extraPrice?: number) => void;
  onRemoveFromCart: (product: Product, notes?: string[]) => void;
  onClearCart: () => void;
  onChargeOrder: () => void;
}

export default function PosTicketSidebar({
  cart,
  orderType,
  paymentMethod,
  cashGiven,
  splitCashAmount,
  customerName,
  customerPhone,
  isSubmitting,
  onSetOrderType,
  onSetPaymentMethod,
  onSetCashGiven,
  onSetSplitCashAmount,
  onSetCustomerName,
  onSetCustomerPhone,
  onAddToCart,
  onRemoveFromCart,
  onClearCart,
  onChargeOrder,
}: PosTicketSidebarProps) {
  // 🚀 TOTAL AMOUNT INCLUDES PAID EXTRAS!
  const totalAmount = cart.reduce((sum, item) => {
    const basePrice = parseFloat(formatPrice(item.product.price || (item.product as any).unit_price));
    const unitPriceWithExtra = basePrice + (item.extraPrice || 0);
    return sum + unitPriceWithExtra * item.quantity;
  }, 0);

  const cashGivenNum = parseFloat(cashGiven) || 0;
  const changeDue = Math.max(0, cashGivenNum - totalAmount);

  // Validation Guard
  const isCashInsufficient = paymentMethod === 'cash' && cashGivenNum < totalAmount;
  const splitCashNum = parseFloat(splitCashAmount) || 0;
  const splitCardNum = Math.max(0, totalAmount - splitCashNum);
  const isSplitInvalid = paymentMethod === 'split' && (splitCashNum <= 0 || splitCashNum >= totalAmount);

  return (
    <aside className="w-80 sm:w-96 md:w-[380px] bg-zinc-900 border-l border-zinc-800 flex flex-col justify-between shrink-0 font-sans">
      {/* Header & Order Type */}
      <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
        <div className="flex bg-zinc-950 border border-zinc-800 p-1 rounded-xl gap-1">
          <button
            onClick={() => onSetOrderType('dine_in')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              orderType === 'dine_in' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'
            }`}
          >
            Sur Place
          </button>
          <button
            onClick={() => onSetOrderType('takeaway')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              orderType === 'takeaway' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'
            }`}
          >
            À Emporter
          </button>
        </div>

        <button
          onClick={onClearCart}
          disabled={cart.length === 0}
          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition disabled:opacity-30"
          title="Clear Ticket"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Customer Inputs */}
      <div className="px-3 pt-3 space-y-2 border-b border-zinc-800/80 pb-3">
        <div className="relative">
          <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Customer Name (e.g. Lucas)"
            value={customerName}
            onChange={(e) => onSetCustomerName(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="relative">
          <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="tel"
            placeholder="Phone (Optional for Loyalty)"
            value={customerPhone}
            onChange={(e) => onSetCustomerPhone(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
            <ShoppingBag className="w-8 h-8 stroke-1" />
            <p className="text-xs font-medium">Tap product tiles to build active ticket</p>
          </div>
        ) : (
          cart.map((item, idx) => {
            const basePrice = parseFloat(formatPrice(item.product.price || (item.product as any).unit_price));
            
            // 🚀 INCLUDES PAID EXTRAS IN UNIT PRICE DISPLAY
            const unitPriceWithExtra = basePrice + (item.extraPrice || 0);
            const subtotal = (unitPriceWithExtra * item.quantity).toFixed(2);

            // 🚀 UNIQUE REACT KEY (Fixes duplicate key warning!)
            const uniqueKey = `${item.product.id}-${(item.notes || []).join('-')}-${idx}`;

            return (
              <div
                key={uniqueKey}
                className="bg-zinc-950 border border-zinc-800/80 p-2.5 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="font-bold text-white truncate">{item.product.name}</p>

                  {/* 🚀 DISPLAY MODIFIER NOTES */}
                  {item.notes && item.notes.length > 0 && (
                    <p className="text-amber-400 font-semibold text-[10px] truncate mt-0.5">
                      {item.notes.join(', ')}
                    </p>
                  )}

                  <p className="text-zinc-500 text-[10px] mt-0.5">
                    €{unitPriceWithExtra.toFixed(2)} x {item.quantity}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-black text-amber-400 pr-1">€{subtotal}</span>
                  <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
                    <button
                      onClick={() => onRemoveFromCart(item.product, item.notes || [])}
                      className="p-1 text-zinc-400 hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-xs px-1">{item.quantity}</span>
                    <button
                      onClick={() => onAddToCart(item.product, item.notes || [], item.extraPrice || 0)}
                      className="p-1 text-zinc-400 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Payment Selector & Calculator */}
      <div className="p-3.5 border-t border-zinc-800 space-y-3 bg-zinc-950">
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => onSetPaymentMethod('card')}
            className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition ${
              paymentMethod === 'card'
                ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Carte (CB)
          </button>
          <button
            onClick={() => onSetPaymentMethod('cash')}
            className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition ${
              paymentMethod === 'cash'
                ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" /> Espèces
          </button>
          <button
            onClick={() => onSetPaymentMethod('split')}
            className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition ${
              paymentMethod === 'split'
                ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            <Split className="w-3.5 h-3.5" /> Mixte (Split)
          </button>
        </div>

        {/* CASH CALCULATOR */}
        {paymentMethod === 'cash' && (
          <div className="space-y-2 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Cash Received:</span>
              <input
                type="number"
                value={cashGiven}
                onChange={(e) => onSetCashGiven(e.target.value)}
                placeholder="€0.00"
                className="w-24 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-right font-bold text-amber-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-4 gap-1">
              {[5, 10, 20, 50].map((val) => (
                <button
                  key={val}
                  onClick={() => onSetCashGiven(String(val))}
                  className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 py-1 text-[10px] font-bold rounded"
                >
                  €{val}
                </button>
              ))}
            </div>

            {isCashInsufficient ? (
              <div className="flex items-center gap-1.5 text-[10px] text-red-400 font-bold pt-1 border-t border-zinc-800">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Need €{(totalAmount - cashGivenNum).toFixed(2)} more cash!</span>
              </div>
            ) : (
              <div className="flex justify-between items-center pt-1 border-t border-zinc-800/80">
                <span className="text-zinc-400">Change Due:</span>
                <span className="font-extrabold text-emerald-400">€{changeDue.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* MIXTE / SPLIT CALCULATOR */}
        {paymentMethod === 'split' && (
          <div className="space-y-2 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Cash Portion:</span>
              <input
                type="number"
                value={splitCashAmount}
                onChange={(e) => onSetSplitCashAmount(e.target.value)}
                placeholder="€0.00"
                className="w-24 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-right font-bold text-amber-400 focus:outline-none"
              />
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>Card Portion (Remaining):</span>
              <span className="font-bold text-white">€{splitCardNum.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* TOTAL & CHARGE BUTTON */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 font-bold text-xs">Total Due:</span>
            <span className="text-xl font-black text-amber-400">€{totalAmount.toFixed(2)}</span>
          </div>

          <button
            disabled={cart.length === 0 || isSubmitting || isCashInsufficient || isSplitInvalid}
            onClick={onChargeOrder}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            {isSubmitting ? 'Processing...' : `Charge & Send (€${totalAmount.toFixed(2)})`}
          </button>
        </div>
      </div>
    </aside>
  );
}
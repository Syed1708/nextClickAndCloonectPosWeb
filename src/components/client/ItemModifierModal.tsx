'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { getImageUrl, formatPrice } from '@/lib/api';
import { X, Check } from 'lucide-react';

interface ItemModifierModalProps {
  product: Product | null;
  initialNotes?: string[];
  onClose: () => void;
  onConfirm: (product: Product, notes: string[], extraPrice: number) => void;
}

const EXCLUSIONS = [
  'No Onions',
  'No Pickles',
  'No Tomatoes',
  'No Sauce',
];

const PAID_EXTRAS = [
  { label: 'Extra Cheese (+€1.00)', price: 1.0 },
  { label: 'Extra Bacon (+€1.50)', price: 1.5 },
  { label: 'Double Patty (+€2.50)', price: 2.5 },
  { label: 'Sauce on Side (+€0.00)', price: 0.0 },
];

const COOKING_PRESETS = ['Rare', 'Medium', 'Well Done'];

export default function ItemModifierModal({
  product,
  initialNotes = [],
  onClose,
  onConfirm,
}: ItemModifierModalProps) {
  const [selectedNotes, setSelectedNotes] = useState<string[]>(initialNotes);
  const [customNote, setCustomNote] = useState('');

  if (!product) return null;

  const toggleNote = (noteLabel: string) => {
    if (selectedNotes.includes(noteLabel)) {
      setSelectedNotes(selectedNotes.filter((n) => n !== noteLabel));
    } else {
      setSelectedNotes([...selectedNotes, noteLabel]);
    }
  };

  const handleAddCustomNote = () => {
    if (customNote.trim() && !selectedNotes.includes(customNote.trim())) {
      setSelectedNotes([...selectedNotes, customNote.trim()]);
      setCustomNote('');
    }
  };

  const extraPrice = selectedNotes.reduce((sum, note) => {
    const match = PAID_EXTRAS.find((p) => p.label === note);
    return sum + (match ? match.price : 0);
  }, 0);

  const basePrice = parseFloat(formatPrice(product.price || (product as any).unit_price));
  const finalPrice = basePrice + extraPrice;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-6 relative max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl bg-zinc-800 overflow-hidden shrink-0">
              <Image src={getImageUrl(product.image)} alt={product.name} fill className="object-cover" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">{product.name}</h3>
              <p className="text-amber-400 font-black text-sm">€{finalPrice.toFixed(2)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white bg-zinc-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
          {/* Cooking Presets */}
          <div className="space-y-2">
            <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">
              Cooking Preference
            </span>
            <div className="flex flex-wrap gap-2">
              {COOKING_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => toggleNote(preset)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition ${
                    selectedNotes.includes(preset)
                      ? 'bg-amber-500 text-zinc-950 border-amber-500'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Exclusions */}
          <div className="space-y-2">
            <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">
              Exclusions
            </span>
            <div className="flex flex-wrap gap-2">
              {EXCLUSIONS.map((ex) => (
                <button
                  key={ex}
                  onClick={() => toggleNote(ex)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition ${
                    selectedNotes.includes(ex)
                      ? 'bg-red-500/20 text-red-400 border-red-500/50'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Paid Extras */}
          <div className="space-y-2">
            <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">
              Paid Extras
            </span>
            <div className="flex flex-wrap gap-2">
              {PAID_EXTRAS.map((extra) => (
                <button
                  key={extra.label}
                  onClick={() => toggleNote(extra.label)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition ${
                    selectedNotes.includes(extra.label)
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  {extra.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Note Input */}
          <div className="space-y-2">
            <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">
              Custom Kitchen Instruction
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Extra Crispy Fries..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleAddCustomNote}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-3 py-2 rounded-xl text-xs"
              >
                Add
              </button>
            </div>
          </div>

          {/* Active Notes Badges */}
          {selectedNotes.length > 0 && (
            <div className="pt-2 border-t border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">Active Instructions:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedNotes.map((note) => (
                  <span
                    key={note}
                    className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                  >
                    {note}
                    <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => toggleNote(note)} />
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Button */}
        <div className="pt-2 border-t border-zinc-800">
          <button
            onClick={() => onConfirm(product, selectedNotes, extraPrice)}
            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            <Check className="w-4 h-4" /> Confirm & Add Item (€{finalPrice.toFixed(2)})
          </button>
        </div>
      </div>
    </div>
  );
}
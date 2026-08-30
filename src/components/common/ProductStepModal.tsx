'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Product, OptionGroup, OptionItem } from '@/types';
import { getImageUrl, formatPrice } from '@/lib/api';
import {
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  Info,
  Sparkles,
} from 'lucide-react';

interface ProductStepModalProps {
  product: Product | null;
  onClose: () => void;
  onConfirm: (product: Product, notes: string[], extraPrice: number) => void;
}

export default function ProductStepModal({
  product,
  onClose,
  onConfirm,
}: ProductStepModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepSelections, setStepSelections] = useState<Record<number, string[]>>({});
  const [customInstruction, setCustomInstruction] = useState('');

  if (!product) return null;

  // Retrieve option groups configured in the Laravel database
  const groups: OptionGroup[] =
    (product as any).option_groups || (product as any).optionGroups || [];

  const currentGroup: OptionGroup | undefined = groups[currentStepIndex];
  const freeChoiceLimit = currentGroup
    ? currentGroup.pivot?.free_choice_limit_override ?? currentGroup.free_choice_limit ?? 0
    : 0;

  // Toggle option choice
  const handleToggleOption = (group: OptionGroup, option: OptionItem) => {
    const groupId = group.id;
    const currentList = stepSelections[groupId] || [];

    if (group.selection_type === 'single_select') {
      setStepSelections({ ...stepSelections, [groupId]: [option.name] });
    } else {
      if (currentList.includes(option.name)) {
        setStepSelections({
          ...stepSelections,
          [groupId]: currentList.filter((name) => name !== option.name),
        });
      } else {
        if (group.max_selections > 0 && currentList.length >= group.max_selections) {
          return;
        }
        setStepSelections({ ...stepSelections, [groupId]: [...currentList, option.name] });
      }
    }
  };

  // Calculate live dynamic extra price
  let totalExtraPrice = 0;
  const structuredNotes: string[] = [];

  groups.forEach((group) => {
    const selectedNames = stepSelections[group.id] || [];
    const limit = group.pivot?.free_choice_limit_override ?? group.free_choice_limit ?? 0;

    if (selectedNames.length > 0) {
      structuredNotes.push(`${group.name}: ${selectedNames.join(', ')}`);
    }

    selectedNames.forEach((optName, index) => {
      const optionObj = group.options?.find((o) => o.name === optName);
      if (optionObj) {
        const isFree = index < limit;
        if (!isFree) {
          totalExtraPrice += optionObj.extra_price || 0;
        }
      }
    });
  });

  if (customInstruction.trim()) {
    structuredNotes.push(`Note: ${customInstruction.trim()}`);
  }

  const basePrice = parseFloat(formatPrice(product.price || (product as any).unit_price));
  const finalPrice = basePrice + totalExtraPrice;

  // Final Confirmation Handler
  const handleFinish = () => {
    onConfirm(product, structuredNotes, totalExtraPrice);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-xl w-full max-h-[90vh] flex flex-col justify-between shadow-2xl relative space-y-5">
        
        {/* Modal Top Header */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl bg-zinc-800 overflow-hidden shrink-0">
              <Image src={getImageUrl(product.image_path || (product as any).image)} alt={product.name} fill className="object-cover" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">{product.name}</h3>
              <p className="text-amber-400 font-black text-sm">€{finalPrice.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 font-bold hidden sm:inline">
              Step {currentStepIndex + 1} of {groups.length}
            </span>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Instructions Banner */}
        {currentGroup && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-center justify-between text-xs text-amber-400 font-bold shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Step {currentStepIndex + 1}: {currentGroup.name}</span>
            </div>
            <span className="text-[11px] text-zinc-300">
              {freeChoiceLimit > 0 ? `✨ ${freeChoiceLimit} Free Choice(s) Included` : 'Paid Extras'}
            </span>
          </div>
        )}

        {/* Dynamic Options Grid */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {currentGroup?.options?.map((opt) => {
              const selectedList = stepSelections[currentGroup.id] || [];
              const isSelected = selectedList.includes(opt.name);
              const selectedIndex = selectedList.indexOf(opt.name);

              let isFreeChoice = false;
              let priceBadge = '';

              if (currentGroup.selection_type === 'single_select') {
                if (freeChoiceLimit > 0) {
                  isFreeChoice = true;
                  priceBadge = 'INCLUDED';
                } else {
                  priceBadge = opt.extra_price > 0 ? `+€${opt.extra_price.toFixed(2)}` : 'FREE';
                }
              } else {
                if (isSelected) {
                  isFreeChoice = selectedIndex < freeChoiceLimit;
                  priceBadge = isFreeChoice ? 'INCLUDED' : `+€${opt.extra_price.toFixed(2)}`;
                } else {
                  if (selectedList.length < freeChoiceLimit) {
                    isFreeChoice = true;
                    priceBadge = 'FREE INCLUDED';
                  } else {
                    priceBadge = opt.extra_price > 0 ? `+€${opt.extra_price.toFixed(2)}` : 'FREE';
                  }
                }
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleToggleOption(currentGroup, opt)}
                  className={`p-3.5 rounded-2xl border-2 flex flex-col justify-between text-left transition active:scale-95 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500/40'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  {opt.image_path && (
                    <div className="relative w-full h-16 rounded-xl bg-zinc-800 overflow-hidden mb-2">
                      <Image src={getImageUrl(opt.image_path)} alt={opt.name} fill className="object-cover" />
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold truncate">{opt.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                    </div>

                    <span className={`text-[10px] font-black block mt-1 ${isFreeChoice ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {priceBadge}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Optional Kitchen Note on Last Step */}
          {currentStepIndex === groups.length - 1 && (
            <div className="pt-3 border-t border-zinc-800 space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Special Kitchen Note (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Extra napkins, sauce on side..."
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          )}
        </div>

        {/* Modal Navigation Footer */}
        <div className="pt-4 border-t border-zinc-800 flex justify-between items-center shrink-0">
          <button
            type="button"
            onClick={() => {
              if (currentStepIndex > 0) setCurrentStepIndex((prev) => prev - 1);
              else onClose();
            }}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-5 py-3 rounded-xl text-xs flex items-center gap-2 transition"
          >
            <ArrowLeft className="w-4 h-4" /> {currentStepIndex === 0 ? 'Cancel' : 'Previous'}
          </button>

          {currentStepIndex < groups.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStepIndex((prev) => prev + 1)}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black px-6 py-3 rounded-xl text-xs flex items-center gap-2 transition"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black px-6 py-3 rounded-xl text-xs flex items-center gap-2 transition shadow-lg"
            >
              <Check className="w-4 h-4" /> Add Item (€{finalPrice.toFixed(2)})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
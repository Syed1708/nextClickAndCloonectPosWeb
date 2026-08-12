'use client';

import Image from 'next/image';
import { Product } from '@/types';
import { getImageUrl, formatPrice } from '@/lib/api';
import { ShieldAlert, Flame, Sparkles, Utensils } from 'lucide-react';

// Allergen Configuration Map
const ALLERGEN_MAP: Record<string, { label: string; icon: string }> = {
  gluten: { label: 'Contains Gluten / Wheat', icon: '🌾' },
  dairy: { label: 'Contains Dairy / Lactose', icon: '🥛' },
  nuts: { label: 'Contains Nuts / Peanuts', icon: '🥜' },
  eggs: { label: 'Contains Eggs', icon: '🥚' },
  soy: { label: 'Contains Soy', icon: '🫘' },
  fish: { label: 'Contains Fish / Shellfish', icon: '🐟' },
  mustard: { label: 'Contains Mustard', icon: '🌭' },
  sesame: { label: 'Contains Sesame Seeds', icon: '🥯' },
};

// Dietary Lifestyle Flag Map
const DIETARY_MAP: Record<string, { label: string; icon: string; bg: string }> = {
  halal: { label: '100% Halal Certified', icon: '☪️', bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  vegetarian: { label: 'Vegetarian Dish', icon: '🌿', bg: 'bg-green-500/10 border-green-500/30 text-green-400' },
  vegan: { label: 'Plant-Based Vegan', icon: '🌱', bg: 'bg-teal-500/10 border-teal-500/30 text-teal-400' },
  spicy: { label: 'Spicy / Hot', icon: '🌶️', bg: 'bg-red-500/10 border-red-500/30 text-red-400' },
};

export default function ProductDetailsContent({ product }: { product: Product }) {
  const price = formatPrice(product.price || (product as any).unit_price);

  // 🚀 Parses Strings (comma-separated) or Arrays safely
  const parseList = (data: any): string[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { }
      return data.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const allergens = parseList(product.allergens);
  const ingredients = parseList(product.ingredients);
  const dietaryFlags = parseList(product.dietary_flags);

  return (
    <div className="space-y-6 text-white">
      {/* 🚀 Hero Product Image Banner */}
      <div className="relative h-64 sm:h-80 w-full rounded-3xl bg-zinc-800 overflow-hidden border border-zinc-800 shadow-xl">
        <Image
          src={getImageUrl(product.image_path)}
          alt={product.name}
          fill
          unoptimized
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-zinc-950/80 via-transparent to-transparent" />

        {/* Price Pill Badge */}
        <div className="absolute top-4 right-4 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 px-4 py-2 rounded-2xl text-amber-400 font-black text-lg shadow-lg">
          €{price}
        </div>

        {/* Category Badge */}
        {product.category_name && (
          <div className="absolute bottom-4 left-4 bg-amber-500 text-zinc-950 font-black text-xs px-3.5 py-1.5 rounded-xl uppercase tracking-wider shadow-lg">
            {product.category_name}
          </div>
        )}
      </div>

      {/* 🚀 Title & Calories */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{product.name}</h1>
          {product.calories && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold px-3 py-1.5 rounded-xl">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>{product.calories}</span>
            </div>
          )}
        </div>
      </div>

      {/* 🚀 Dietary Lifestyle Badges */}
      {dietaryFlags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {dietaryFlags.map((flag) => {
            const config = DIETARY_MAP[flag.toLowerCase()] || {
              label: flag,
              icon: '✨',
              bg: 'bg-zinc-800 border-zinc-700 text-zinc-300',
            };
            return (
              <span
                key={flag}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 shadow-sm ${config.bg}`}
              >
                <span className="text-sm">{config.icon}</span>
                <span>{config.label}</span>
              </span>
            );
          })}
        </div>
      )}

      {/* 🚀 RICH TEXT HTML DESCRIPTION RENDERER */}
      <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl space-y-2">
        <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Utensils className="w-3.5 h-3.5 text-amber-500" /> About This Item
        </h3>

        {/* 🚀 Renders Rich Text HTML cleanly without raw <p> <strong> tags */}
        <div
          className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-medium [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:text-white [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
          dangerouslySetInnerHTML={{
             __html: product.description || 'Prepared fresh on demand with premium local ingredients.',
          }}
        />
      </div>

      {/* 🚀 Composition & Ingredients Section */}
      {ingredients.length > 0 && (
        <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Composition &amp; Ingredients
          </h3>
          <div className="flex flex-wrap gap-2">
            {ingredients.map((ing, idx) => (
              <span
                key={idx}
                className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {ing}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 🚀 Allergen Warnings Section */}
      {allergens.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" /> Allergen Information
          </h3>
          <p className="text-[11px] text-amber-400/80 font-medium">
            Please review allergen warnings carefully if you have dietary sensitivities.
          </p>
          <div className="flex flex-wrap gap-2">
            {allergens.map((allergen) => {
              const info = ALLERGEN_MAP[allergen.toLowerCase()] || {
                label: allergen,
                icon: '⚠️',
              };
              return (
                <span
                  key={allergen}
                  className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-2"
                >
                  <span className="text-sm">{info.icon}</span>
                  <span>{info.label}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
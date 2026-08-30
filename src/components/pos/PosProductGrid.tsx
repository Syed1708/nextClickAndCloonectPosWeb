'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { getImageUrl, formatPrice } from '@/lib/api';
import ProductStepModal from '@/components/common/ProductStepModal';
import { Search, Plus } from 'lucide-react';

interface PosProductGridProps {
  products: Product[];
  search: string;
  onSearchChange: (val: string) => void;
  onAddToCart: (product: Product, notes?: string[], extraPrice?: number) => void;
}

export default function PosProductGrid({
  products,
  search,
  onSearchChange,
  onAddToCart,
}: PosProductGridProps) {
  const [selectedProductForSteps, setSelectedProductForSteps] = useState<Product | null>(null);

  const handleProductClick = (product: Product) => {
    const optionGroups = (product as any).option_groups || (product as any).optionGroups || [];

    if (optionGroups.length > 0) {
      setSelectedProductForSteps(product); // Opens POS Step Builder Modal
    } else {
      onAddToCart(product, [], 0); // Fast 1-Click Add
    }
  };

  return (
    <main className="flex-1 flex flex-col p-4 overflow-hidden bg-zinc-950">
      {/* Search Bar */}
      <div className="relative mb-4 shrink-0">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search menu products..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-max">
        {products.map((product) => {
          const displayPrice = formatPrice(product.price || (product as any).unit_price);

          return (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              className="bg-zinc-900 border border-zinc-800 hover:border-amber-500 rounded-2xl p-3 flex flex-col justify-between cursor-pointer group transition active:scale-95 shadow-md h-48"
            >
              <div className="relative w-full h-24 rounded-xl bg-zinc-800 overflow-hidden mb-2">
                <Image
                  src={getImageUrl(product.image_path || (product as any).image)}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition"
                />
              </div>

              <div>
                <h4 className="font-extrabold text-xs text-white truncate">{product.name}</h4>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-amber-400 font-black text-xs">€{displayPrice}</span>
                  <span className="p-1 bg-amber-500 text-zinc-950 rounded-lg">
                    <Plus className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step Customization Modal for POS */}
      {selectedProductForSteps && (
        <ProductStepModal
          product={selectedProductForSteps}
          onClose={() => setSelectedProductForSteps(null)}
          onConfirm={(product, notes, extraPrice) => {
            onAddToCart(product, notes, extraPrice);
            setSelectedProductForSteps(null);
          }}
        />
      )}
    </main>
  );
}
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { getImageUrl, formatPrice } from '@/lib/api';
import { Search } from 'lucide-react';
import ItemModifierModal from './ItemModifierModal'; // 🚀 Import Modifier Modal

interface PosProductGridProps {
  products: Product[];
  search: string;
  onSearchChange: (value: string) => void;
  onAddToCart: (product: Product, notes?: string[], extraPrice?: number) => void;
}

export default function PosProductGrid({
  products,
  search,
  onSearchChange,
  onAddToCart,
}: PosProductGridProps) {
  // Active product selected for customization
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <>
      <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-3">
        {/* Search Input */}
        <div className="relative shrink-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Fast search items..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-max">
          {products.map((product) => {
            const price = formatPrice(product.price || (product as any).unit_price);
            return (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)} // 🚀 Opens Modifier Modal on tap!
                className="bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 active:scale-95 transition rounded-2xl p-3 flex flex-col justify-between text-left group h-36 relative overflow-hidden"
              >
                <div className="relative w-full h-16 rounded-xl bg-zinc-800 overflow-hidden mb-2">
                  <Image
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white truncate">{product.name}</h3>
                  <p className="text-amber-400 font-black text-sm">€{price}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🚀 ITEM MODIFIER CUSTOMIZATION MODAL */}
      {selectedProduct && (
        <ItemModifierModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onConfirm={(product, notes, extraPrice) => {
            onAddToCart(product, notes, extraPrice); // 🚀 Calls addToCartWithNotes!
            setSelectedProduct(null);
          }}
        />
      )}
    </>
  );
}
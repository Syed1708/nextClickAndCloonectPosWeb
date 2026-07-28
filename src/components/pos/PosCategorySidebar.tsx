'use client';

import { UtensilsCrossed } from 'lucide-react';

interface PosCategorySidebarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function PosCategorySidebar({
  categories,
  selectedCategory,
  onSelectCategory,
}: PosCategorySidebarProps) {
  return (
    <aside className="w-52 sm:w-60 xl:w-64 bg-zinc-900 border-r border-zinc-800 p-3 overflow-y-auto shrink-0 flex flex-col">
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 px-1">
        Categories
      </span>

      <div className="grid grid-cols-2 gap-2 flex-1 auto-rows-max">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`p-3 rounded-2xl text-xs font-black text-center flex flex-col items-center justify-center gap-1.5 transition active:scale-95 ${
              selectedCategory === cat
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/10'
                : 'bg-zinc-950 text-zinc-300 border border-zinc-800/80 hover:border-zinc-700'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span className="line-clamp-2 leading-tight">{cat}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
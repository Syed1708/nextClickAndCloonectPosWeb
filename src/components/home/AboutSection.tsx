'use client';

import Image from 'next/image';
import { SiteSettings } from '@/types';
import { Sparkles, Utensils, Award, ShieldCheck } from 'lucide-react';

export default function AboutSection({ settings }: { settings?: SiteSettings }) {
  const primaryColor = settings?.primary_color || '#f59e0b';

  return (
    <section id="about" className="py-20 max-w-7xl mx-auto px-6 w-full">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center shadow-2xl relative overflow-hidden">
        {/* Background Accent Glow */}
        <div
          className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: primaryColor }}
        />

        {/* Left Column: Story & Content (7 cols) */}
        <div className="lg:col-span-7 space-y-6 z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-zinc-800 border border-zinc-700" style={{ color: primaryColor }}>
            <Sparkles className="w-3.5 h-3.5" /> Our Story &amp; Quality
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            {settings?.about_title || 'Gourmet Passion in Bordeaux'}
          </h2>

          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium">
            {settings?.about_text ||
              'Founded in 2026, Burger Palace brings gourmet artisanal burgers to the heart of Bordeaux. We source our beef directly from local French farmers, bake our brioche buns fresh every morning, and prepare signature house sauces from scratch daily.'}
          </p>

          {/* Quality Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
            <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-2xl">
              <Award className="w-5 h-5 mb-1.5" style={{ color: primaryColor }} />
              <p className="font-extrabold text-white text-sm">100% Local Beef</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Fresh French Sourcing</p>
            </div>

            <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-2xl">
              <Utensils className="w-5 h-5 mb-1.5" style={{ color: primaryColor }} />
              <p className="font-extrabold text-white text-sm">Artisanal Buns</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Baked Daily</p>
            </div>

            <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-2xl col-span-2 sm:col-span-1">
              <ShieldCheck className="w-5 h-5 mb-1.5" style={{ color: primaryColor }} />
              <p className="font-extrabold text-white text-sm">Halal Certified</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Quality Assurance</p>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Card (5 cols) */}
        <div className="lg:col-span-5 relative z-10">
          <div className="relative h-80 sm:h-96 w-full rounded-3xl overflow-hidden border-2 border-zinc-800 bg-zinc-950 shadow-2xl group">
            <Image
              src="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80"
              alt="Gourmet Burger Crafting"
              fill
              unoptimized
              className="object-cover group-hover:scale-105 transition duration-500"
            />
            <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 bg-zinc-950/90 backdrop-blur-md p-4 rounded-2xl border border-zinc-800">
              <p className="font-black text-sm text-white">Crafted Fresh On Demand</p>
              <p className="text-xs text-zinc-400 mt-0.5">Track your order live on our KDS Kitchen Display System.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
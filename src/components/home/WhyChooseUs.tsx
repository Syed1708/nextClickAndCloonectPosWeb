'use client';

import { SiteSettings } from '@/types';

export default function WhyChooseUs({ settings }: { settings?: SiteSettings }) {
  const primaryColor = settings?.primary_color || '#f59e0b';
  const items = settings?.why_choose_us_items || [
    { icon: '🥩', title: '100% Fresh Local Beef', description: 'Locally sourced French beef ground daily in our kitchen.' },
    { icon: '🍞', title: 'Artisanal Brioche Buns', description: 'Baked fresh every morning by local Bordeaux bakeries.' },
    { icon: '⚡', title: 'Express Preparation', description: 'Real-time kitchen display tracking ensures hot, fresh food.' },
  ];

  return (
    <section className="py-16 max-w-7xl mx-auto px-6 w-full">
      <div className="text-center space-y-2 mb-12">
        <h2 className="text-3xl font-extrabold text-white">{settings?.why_choose_us_title || 'Why Burger Palace?'}</h2>
        <p className="text-zinc-400 text-sm">{settings?.why_choose_us_subtitle || 'Uncompromising quality in every single bite.'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {items.map((item: any, idx: number) => (
          <div key={idx} className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-3 text-center">
            <div className="text-4xl mb-2">{item.icon || '✨'}</div>
            <h3 className="font-extrabold text-lg text-white">{item.title}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
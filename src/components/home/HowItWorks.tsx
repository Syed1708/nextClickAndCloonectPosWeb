'use client';

import { SiteSettings } from '@/types';

export default function HowItWorks({ settings }: { settings?: SiteSettings }) {
  const primaryColor = settings?.primary_color || '#f59e0b';
  const steps = settings?.how_it_works_steps || [
    { step: 1, title: 'Explore & Customize', description: 'Browse our menu, select sizes, sauces, and extra toppings.' },
    { step: 2, title: 'Fast Checkout', description: 'Pay securely via Stripe or choose Pay at Counter.' },
    { step: 3, title: 'Express Pickup', description: 'Collect your hot meal at the counter or sit at your table.' },
  ];

  return (
    <section className="py-16 max-w-7xl mx-auto px-6 w-full">
      <div className="text-center space-y-2 mb-12">
        <h2 className="text-3xl font-extrabold text-white">{settings?.how_it_works_title || '3 Easy Steps to Order'}</h2>
        <p className="text-zinc-400 text-sm">{settings?.how_it_works_subtitle || 'Fast, simple, and delicious gourmet dining.'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((s: any, idx: number) => (
          <div key={idx} className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-4 text-center">
            <div
              className="w-12 h-12 text-zinc-950 font-black text-xl rounded-2xl flex items-center justify-center mx-auto shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              {s.step || idx + 1}
            </div>
            <h3 className="font-extrabold text-lg text-white">{s.title}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{s.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
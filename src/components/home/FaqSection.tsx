'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SiteSettings } from '@/types';

export default function FaqSection({ settings }: { settings?: SiteSettings }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const primaryColor = settings?.primary_color || '#f59e0b';

  const faqs = settings?.faq_items || [
    { question: 'What are your Click & Collect pickup hours?', answer: 'Click & Collect is available during shift hours: 10:00 - 14:30 and 18:30 - 22:30.' },
    { question: 'Are your meats Halal certified?', answer: 'Yes! All our meat options are 100% Halal certified.' },
    { question: 'How do table reservations work?', answer: 'You can reserve a table online 24/7. Once confirmed, your table will be held for 15 minutes.' },
  ];

  return (
    <section className="py-16 max-w-4xl mx-auto px-6 w-full space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-white">{settings?.faq_title || 'Frequently Asked Questions'}</h2>
        <p className="text-zinc-400 text-sm">{settings?.faq_subtitle || 'Got questions? We have answers.'}</p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq: any, idx: number) => (
          <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className="w-full p-5 text-left font-bold text-sm text-white flex justify-between items-center"
            >
              <span>{faq.question}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openIdx === idx ? 'rotate-180' : ''}`} style={{ color: primaryColor }} />
            </button>
            {openIdx === idx && (
              <div className="px-5 pb-5 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-3">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
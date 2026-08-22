'use client';

import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { SiteSettings } from '@/types';

export default function NewsletterBanner({ settings }: { settings?: SiteSettings }) {
  const primaryColor = settings?.primary_color || '#f59e0b';
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <section className="py-12 max-w-7xl mx-auto px-6 w-full">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
        {/* Background Accent Glow */}
        <div
          className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: primaryColor }}
        />

        <div className="space-y-2 text-center md:text-left z-10 max-w-xl">
          <span
            className="text-xs font-black uppercase tracking-wider block"
            style={{ color: primaryColor }}
          >
            Exclusive Offers &amp; Updates
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Join the Burger Palace Club
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm">
            Subscribe to receive secret promo codes, weekend deals, and new menu announcements directly in your inbox.
          </p>
        </div>

        {/* Subscription Form */}
        <div className="w-full md:w-auto z-10 min-w-75 sm:min-w-95">
          {subscribed ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Thank you for subscribing! Check your email soon.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                placeholder="Enter your email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="text-zinc-950 font-black px-6 py-3.5 rounded-2xl text-xs transition flex items-center justify-center gap-2 shrink-0 shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                <span>Subscribe</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
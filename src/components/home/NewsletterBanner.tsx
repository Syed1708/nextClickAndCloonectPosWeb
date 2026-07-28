'use client';

import { useState } from 'react';
import { Gift, Send, Check } from 'lucide-react';

export default function NewsletterBanner() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <section className="py-16 bg-linear-to-r from-amber-500 to-amber-600 text-zinc-950">
      <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="space-y-2 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-zinc-950/10 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
            <Gift className="w-4 h-4" /> Exclusive Offer
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Get 10% Off Your First Order!
          </h2>
          <p className="text-zinc-900/80 text-sm font-medium">
            Subscribe to receive secret promo codes and new menu drops.
          </p>
        </div>

        {subscribed ? (
          <div className="bg-zinc-950 text-white font-bold px-8 py-4 rounded-2xl flex items-center gap-2 text-sm">
            <Check className="w-5 h-5 text-amber-400" /> You&apos;re subscribed! Use code <span className="text-amber-400 uppercase">BURGER10</span> at checkout.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email..."
              className="bg-zinc-950 text-white placeholder-zinc-500 px-5 py-4 rounded-2xl text-sm focus:outline-none w-full sm:w-80"
            />
            <button
              type="submit"
              className="bg-zinc-950 hover:bg-zinc-900 text-white font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 text-sm transition"
            >
              Claim Promo <Send className="w-4 h-4 text-amber-400" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
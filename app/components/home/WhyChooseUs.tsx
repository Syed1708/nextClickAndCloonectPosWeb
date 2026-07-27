import { Flame, ShieldCheck, Zap, Heart } from 'lucide-react';

const FEATURES = [
  {
    title: '100% French Beef',
    description: 'Sourced directly from local Nouvelle-Aquitaine farms, ground fresh daily.',
    icon: Flame,
  },
  {
    title: 'Fresh Brioche Buns',
    description: 'Baked every morning by our partner bakery in central Bordeaux.',
    icon: Heart,
  },
  {
    title: 'Zero Waiting Lines',
    description: 'Your order is timed precisely for when you arrive at our counter.',
    icon: Zap,
  },
  {
    title: 'Quality Guaranteed',
    description: 'Prepared under strict hygienic standards with zero artificial additives.',
    icon: ShieldCheck,
  },
];

export default function WhyChooseUs() {
  return (
    <section id="about" className="py-20 bg-zinc-900/40 border-b border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-amber-500 font-bold text-xs uppercase tracking-widest">
              Uncompromising Quality
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Why Bordeaux Loves <span className="text-amber-500">Burger Palace</span>
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              We believe fast food doesn’t have to mean poor quality. Every single burger we serve is crafted with passion, premium local French ingredients, and house-made sauces.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {FEATURES.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.title} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-2">
                    <Icon className="w-5 h-5 text-amber-500" />
                    <h4 className="font-bold text-white text-sm">{feat.title}</h4>
                    <p className="text-zinc-400 text-xs leading-relaxed">{feat.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center space-y-2">
              <span className="text-4xl font-black text-amber-400 block">100%</span>
              <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Local French Meat</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center space-y-2">
              <span className="text-4xl font-black text-amber-400 block">&lt;15m</span>
              <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Average Pickup Time</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center space-y-2">
              <span className="text-4xl font-black text-amber-400 block">4.9 ★</span>
              <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Customer Rating</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center space-y-2">
              <span className="text-4xl font-black text-amber-400 block">12k+</span>
              <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Burgers Served</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
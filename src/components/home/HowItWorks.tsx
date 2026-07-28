import { Utensils, CreditCard, Clock } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Browse & Order',
    description: 'Explore our artisanal smash burgers, sides, and house drinks on our web menu.',
    icon: Utensils,
  },
  {
    step: '02',
    title: 'Secure Online Payment',
    description: 'Pay instantly via Stripe and receive live real-time status updates from our kitchen.',
    icon: CreditCard,
  },
  {
    step: '03',
    title: 'Express Pick Up',
    description: 'Pick up your meal piping hot at our Bordeaux counter in under 15 minutes.',
    icon: Clock,
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-zinc-950 border-b border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
          <span className="text-amber-500 font-bold text-xs uppercase tracking-widest">
            Fast & Seamless
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            How Click & Collect Works
          </h2>
          <p className="text-zinc-400 text-sm">
            Enjoy fresh gourmet food with zero queueing time in 3 easy steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-zinc-900 border border-zinc-800/80 p-8 rounded-3xl relative flex flex-col justify-between hover:border-amber-500/40 transition group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl group-hover:bg-amber-500 group-hover:text-zinc-950 transition">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-4xl font-black text-zinc-800 group-hover:text-amber-500/20 transition">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
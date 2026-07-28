import { HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'How long does my Click & Collect order take?',
    a: 'Most orders take between 10 to 15 minutes. You can track the status live on your portal in real time.',
  },
  {
    q: 'Where do I pick up my order?',
    a: 'Pick up your order directly at our counter at 12 Rue Sainte-Catherine, 33000 Bordeaux.',
  },
  {
    q: 'Can I pay in cash upon pickup?',
    a: 'To ensure instant preparation and zero queue times, all web Click & Collect orders are paid securely via Stripe online.',
  },
  {
    q: 'How do I know when my food is ready?',
    a: 'Once your order is ready, your client tracking portal will show "Ready at Packing" in real time.',
  },
];

export default function FaqSection() {
  return (
    <section className="py-20 bg-zinc-950 border-b border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
          <span className="text-amber-500 font-bold text-xs uppercase tracking-widest">
            Got Questions?
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400">
                <HelpCircle className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-white text-base">{faq.q}</h3>
              </div>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed pl-7">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
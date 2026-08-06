'use client';

import { useState, useEffect } from 'react';
import { getEcho } from '@/lib/echoreverb';
import { Clock, CheckCircle2, ChefHat, PackageCheck, AlertCircle } from 'lucide-react';

export default function RealtimeTracker({ initialOrder }: { initialOrder: any }) {
  const [order, setOrder] = useState<any>(initialOrder);

useEffect(() => {
  if (!initialOrder?.id) return;

  const echo = getEcho();
  if (!echo) {
    console.error('❌ Echo instance not initialized');
    return;
  }

  console.log(`🔌 Subscribing to channel: orders.${initialOrder.id}`);
  const channel = echo.channel(`orders.${initialOrder.id}`);

  // 🚀 Listens for .OrderStatusUpdated (matching broadcastAs() in Laravel)
  channel.listen('.order-event', (event: any) => {
    console.log('⚡ Live Order Event Received:', event);
    
    if (event && event.order) {
      setOrder(event.order); // Dynamically updates customer order status bar!
    }
  });

  return () => {
    console.log(`🔌 Leaving channel: orders.${initialOrder.id}`);
    echo.leaveChannel(`orders.${initialOrder.id}`);
  };
}, [initialOrder?.id]);

  const prepStatus = order.preparation_status || 'not_accepted';

  const steps = [
    { key: 'not_accepted', label: 'En attente Validation', icon: Clock, desc: 'Restaurant consulte' },
    { key: 'accepted', label: 'Commande Acceptée', icon: CheckCircle2, desc: `Prêt en ~${order.estimated_prep_time || 20} min` },
    { key: 'preparing', label: 'En Préparation', icon: ChefHat, desc: 'Chef en cuisine' },
    { key: 'ready', label: 'Prêt à retirer', icon: PackageCheck, desc: 'Disponible au comptoir' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'not_accepted': return 0;
      case 'accepted': return 1;
      case 'preparing': return 2;
      case 'ready':
      case 'delivered':
      case 'completed': return 3;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(prepStatus);

  if (prepStatus === 'cancelled' || order.status === 'refunded') {
    return (
      <div className="bg-red-950/20 border border-red-500/30 p-6 rounded-3xl text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
        <h3 className="font-extrabold text-red-400 text-lg">Commande Annulée / Refusée</h3>
        <p className="text-zinc-400 text-xs">Le restaurant n’a pas pu valider votre commande. Le remboursement a été effectué.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-zinc-800 pb-4">
        <div>
          <span className="text-amber-500 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            Suivi en Temps Réel
          </span>
          <h2 className="text-2xl font-black mt-1 text-white">
            Commande #{order.sequence_number || order.id}
          </h2>
        </div>

        {order.estimated_prep_time && prepStatus !== 'not_accepted' && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl text-right">
            <span className="text-zinc-400 text-[10px] uppercase font-bold block">Heure Prévue de Retrait</span>
            <span className="text-amber-400 font-black text-base">
              {order.estimated_ready_at ? new Date(order.estimated_ready_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : `~${order.estimated_prep_time} min`}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isPassed = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={step.key}
              className={`p-4 rounded-2xl border flex flex-col items-center text-center transition-all ${
                isCurrent
                  ? 'bg-amber-500/10 border-amber-500 text-amber-400 scale-105 shadow-lg'
                  : isPassed
                  ? 'bg-zinc-800/80 border-zinc-700 text-emerald-400'
                  : 'bg-zinc-950 border-zinc-800/80 text-zinc-600'
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${isCurrent ? 'animate-bounce' : ''}`} />
              <span className="text-xs font-bold text-white mb-0.5">{step.label}</span>
              <span className="text-[10px] text-zinc-500">{step.desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
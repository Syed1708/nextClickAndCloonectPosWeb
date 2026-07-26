'use client';

import { useState, useEffect } from 'react';
import { getEcho } from '../lib/echo';
import { Clock, ChefHat, PackageCheck, CheckCircle2 } from 'lucide-react';

export default function RealtimeTracker({ initialOrder }: { initialOrder: any }) {
  const [orderStatus, setOrderStatus] = useState<string>(
    initialOrder.preparation_status || initialOrder.status || 'pending'
  );

  useEffect(() => {
    const echo = getEcho();
    if (!echo) return;

    // Subscribes to the specific order channel
    const channel = echo.channel(`orders.${initialOrder.id}`);

    // Listens for 'order-event'
    channel.listen('.order-event', (event: any) => {
      console.log('⚡ Live Reverb Event Received:', event);

      const newStatus =
        event.status ||
        event.order?.preparation_status ||
        event.order?.status;

      if (newStatus) {
        setOrderStatus(newStatus);
      }
    });

    return () => {
      echo.leaveChannel(`orders.${initialOrder.id}`);
    };
  }, [initialOrder.id]);

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'preparing':
        return 1;
      case 'ready':
        return 2;
      case 'delivered':
      case 'completed':
        return 3;
      default:
        return 0;
    }
  };

  const steps = [
    { key: 'pending', label: 'Order Received', icon: Clock, desc: 'Sent to Kitchen' },
    { key: 'preparing', label: 'In Preparation', icon: ChefHat, desc: 'Chef Cooking' },
    { key: 'ready', label: 'Ready at Packing', icon: PackageCheck, desc: 'Chef Finished' },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2, desc: 'Handed Over' },
  ];

  const currentStep = getStepIndex(orderStatus);
  const total = initialOrder.total_incl_vat || initialOrder.total_amount || 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-zinc-800 pb-4">
        <div>
          <span className="text-amber-500 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            Live Kitchen Tracking
          </span>
          <h2 className="text-2xl font-black mt-1 text-white">
            Order #{initialOrder.sequence_number || initialOrder.id}
          </h2>
        </div>
        <div className="sm:text-right">
          <span className="text-zinc-400 text-xs block">Total Paid</span>
          <span className="text-amber-400 font-black text-2xl">€{Number(total).toFixed(2)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isPassed = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={step.key}
              className={`p-4 rounded-2xl border flex flex-col items-center text-center transition-all duration-500 ${
                isCurrent
                  ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10 scale-105'
                  : isPassed
                  ? 'bg-zinc-800/80 border-zinc-700 text-emerald-400'
                  : 'bg-zinc-950 border-zinc-800/80 text-zinc-600'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl mb-2 ${
                  isCurrent
                    ? 'bg-amber-500 text-zinc-950 animate-bounce'
                    : isPassed
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-zinc-900 text-zinc-600'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white mb-0.5">{step.label}</span>
              <span className="text-[10px] text-zinc-500">{step.desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
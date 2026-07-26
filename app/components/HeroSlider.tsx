'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Star } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    title: 'The Double Smash Truffle',
    subtitle: 'Aged French Cheddar, Black Truffle Mayo & Crispy Shallots',
    price: '€14.90',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
    badge: 'Chef Special',
  },
  {
    id: 2,
    title: 'Bordeaux Bacon Supreme',
    subtitle: '100% Beef, Smoked Pork Belly, House BBQ Sauce & Brioche',
    price: '€13.50',
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=1200&q=80',
    badge: 'Best Seller',
  },
  {
    id: 3,
    title: 'Le Spicy Avocado Crunchy',
    subtitle: 'Fresh Guacamole, Jalapeños, Pepper Jack Cheese',
    price: '€12.90',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80',
    badge: 'New Arrival',
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % SLIDES.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

  return (
    <div className="relative h-130 w-full overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
      {SLIDES.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            className="object-cover brightness-50"
            priority={idx === 0}
          />
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/40 to-transparent p-8 sm:p-12 flex flex-col justify-end">
            <div className="max-w-xl space-y-4">
              <span className="inline-flex items-center gap-1.5 bg-amber-500 text-zinc-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                <Star className="w-3.5 h-3.5 fill-zinc-950" /> {slide.badge}
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                {slide.title}
              </h2>
              <p className="text-zinc-300 text-sm sm:text-base font-medium">
                {slide.subtitle}
              </p>
              <div className="flex items-center gap-4 pt-2">
                <span className="text-amber-400 text-2xl font-black">{slide.price}</span>
                <Link
                  href="/order"
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-3 rounded-xl flex items-center gap-2 text-sm transition transform hover:scale-105"
                >
                  Order Now <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Slide Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-zinc-900/80 hover:bg-zinc-800 text-white p-3 rounded-full backdrop-blur border border-zinc-700/50 transition"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-zinc-900/80 hover:bg-zinc-800 text-white p-3 rounded-full backdrop-blur border border-zinc-700/50 transition"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slider Indicators */}
      <div className="absolute bottom-4 right-8 z-20 flex gap-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === current ? 'w-8 bg-amber-500' : 'w-2 bg-zinc-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
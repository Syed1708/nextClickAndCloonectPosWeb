// src/components/ReviewSlider.tsx
'use client'; // 🚀 This is an isolated Client Component

import { useState, useEffect } from 'react';

interface Review {
  stars: string;
  text: string;
  author: string;
}

const reviews: Review[] = [
  {
    stars: "★★★★★",
    text: "Le Double Bacon Burger est juste incroyable ! Le pain du boulanger fait toute la différence. Je commande en ligne toutes les semaines.",
    author: "Julien D. (Bordeaux)"
  },
  {
    stars: "★★★★★",
    text: "Pratique et ultra rapide ! Le Click & Collect fonctionne super bien, ma commande était prête et bien chaude à mon arrivée.",
    author: "Sarah M. (Pessac)"
  },
  {
    stars: "★★★★★",
    text: "Très bons ingrédients frais. Le burger végétarien à l'avocat est délicieux. Je recommande les yeux fermés.",
    author: "Lucas G. (Talence)"
  }
];

export default function ReviewSlider() {
  const [currentIndex, setCurrentSlide] = useState(0);

  useEffect(() => {
    // Automatically slide to the next review every 5 seconds
    const interval = setInterval(() => {
      setCurrentSlide((prevIndex) => (prevIndex + 1) % reviews.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm max-w-xl mx-auto min-h-[180px] flex flex-col justify-between transition duration-150">
      <div>
        <div className="text-yellow-400 text-lg mb-3">
          {reviews[currentIndex].stars}
        </div>
        <p className="text-gray-600 text-sm italic leading-relaxed">
          &quot;{reviews[currentIndex].text}&quot;
        </p>
      </div>
      <span className="block font-bold text-slate-800 text-xs mt-4">
        — {reviews[currentIndex].author}
      </span>
    </div>
  );
}
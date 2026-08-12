'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import ProductDetailsContent from '@/components/product/ProductDetailsContent';
import { X, Loader2 } from 'lucide-react';

export default function InterceptedProductModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    let isCancelled = false;

    async function loadProduct() {
      try {
        const res = await fetch(`${API_BASE}/api/products/${productId}`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setProduct(data.data || data);
          }
        }
      } catch (e) {
        console.error('Failed to load product:', e);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadProduct();

    return () => { isCancelled = true; };
  }, [API_BASE, productId]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl space-y-5">
        <button
          onClick={() => router.back()}
          className="absolute top-4 right-4 z-10 p-2 bg-zinc-950/80 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full backdrop-blur border border-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-20 text-center text-zinc-500 flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <span className="text-xs">Loading product details...</span>
          </div>
        ) : product ? (
          <ProductDetailsContent product={product} />
        ) : (
          <p className="text-center text-zinc-500 py-10 text-sm">Product not found.</p>
        )}
      </div>
    </div>
  );
}
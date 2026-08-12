import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ProductDetailsContent from '@/components/product/ProductDetailsContent';

export const revalidate = 60;

export default async function StandaloneProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let product = null;
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`);
    if (res.ok) {
      const data = await res.json();
      product = data.data || data;
    }
  } catch (e) {
    console.error('Failed to fetch standalone product:', e);
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center justify-center">
        <p className="text-zinc-400 font-bold mb-4">Product not found.</p>
        <Link href="/order" className="bg-amber-500 text-zinc-950 px-4 py-2 rounded-xl font-bold text-xs">
          Return to Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-zinc-950 text-white p-4 sm:p-6 lg:p-8  mx-auto space-y-6">
      <div className="pb-4 border-b border-zinc-800">
        <Link href="/order" className="text-zinc-400 hover:text-white flex items-center gap-2 text-xs font-bold transition">
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </Link>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <ProductDetailsContent product={product} />
      </div>
    </div>
  );
}
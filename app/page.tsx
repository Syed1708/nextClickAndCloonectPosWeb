import Link from 'next/link';
import Image from 'next/image';
import HeroSlider from './components/HeroSlider';
import { fetchMenu, getImageUrl, formatPrice } from './lib/api';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  const allProducts = await fetchMenu();
  const featuredProducts = allProducts.filter((p) => p.is_active ?? true).slice(0, 4);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-zinc-950 font-black text-xl">
              BP
            </div>
            <span className="text-xl font-extrabold tracking-tight">Burger Palace</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
            <a href="#about" className="hover:text-amber-400 transition">About</a>
            <a href="#featured" className="hover:text-amber-400 transition">Featured</a>
            <a href="#contact" className="hover:text-amber-400 transition">Contact</a>
            {
              session?.user ? (

                <Link href="/profile" className="hover:text-amber-400 transition">My Account</Link>
              ) : (
                <Link href="/login" className="text-xs font-semibold text-zinc-300 hover:text-amber-400">
                  Sign In
                </Link>
              )
            }
          </div>

          <Link
            href="/order"
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition"
          >
            <ShoppingBag className="w-4 h-4" /> Order Online
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 md:py-16 max-w-7xl mx-auto px-6 w-full">
        <HeroSlider />
      </section>

      {/* Featured Products Grid */}
      <section id="featured" className="py-16 bg-zinc-900/40 border-y border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Customer Favorites</h2>
              <p className="text-zinc-400 text-sm mt-1">Our top 4 products freshly pulled from our kitchen</p>
            </div>
            <Link href="/order" className="text-amber-400 hover:underline text-sm font-semibold flex items-center gap-1">
              Full Menu <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product: any) => (
              <div key={product.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col justify-between">
                <div className="relative h-48 w-full bg-zinc-800">
                  <Image src={getImageUrl(product.image)} alt={product.name} fill className="object-cover" />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {product.category_name && (
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                        {product.category_name}
                      </span>
                    )}
                    <h3 className="font-bold text-lg text-white mt-0.5">{product.name}</h3>
                    <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{product.description || 'Prepared fresh on demand.'}</p>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-amber-400 font-extrabold text-lg">
                      €{formatPrice(product.price || product.unit_price || product.amount)}
                    </span>
                    <Link href="/order" className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold px-3.5 py-2 rounded-xl">
                      Order
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800 py-8 text-center text-xs text-zinc-600">
        <p>© {new Date().getFullYear()} Burger Palace Bordeaux. SIRET: 892 143 567 00012</p>
      </footer>
    </div>
  );
}
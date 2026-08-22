import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import HeroSlider from '@/components/HeroSlider';
import HowItWorks from '@/components/home/HowItWorks';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import FaqSection from '@/components/home/FaqSection';
import NewsletterBanner from '@/components/home/NewsletterBanner';
import ContactSection from '@/components/home/ContactSection';
import { fetchMenu, fetchSiteSettings, getImageUrl, formatPrice } from '@/lib/api';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Product, SiteSettings } from '@/types';
import AboutSection from '@/components/home/AboutSection';



export default async function HomePage() {
  const [settings, allProducts]: [SiteSettings, Product[]] = await Promise.all([
    fetchSiteSettings(),
    fetchMenu(),
  ]);

  const featuredProducts = allProducts
    .filter((p) => p.is_active ?? true)
    .slice(0, 4);

  const primaryColor = settings.primary_color || '#f59e0b';
  const secondaryColor = settings.secondary_color || '#10b981';

  return (
    <div
      className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans transition-colors duration-200"
      style={
        {
          '--primary-color': primaryColor,
          '--secondary-color': secondaryColor,
        } as React.CSSProperties
      }
    >
      {/* 1. DYNAMIC NAVIGATION BAR */}
      <Navbar settings={settings} />

      {/* 2. PROMO ANNOUNCEMENT BANNER */}
      {settings.promo_active && settings.promo_banner_text && (
        <div
          className="py-2.5 px-4 text-center text-xs font-black uppercase tracking-wider text-zinc-950 shadow-md flex items-center justify-center gap-2"
          style={{ backgroundColor: primaryColor }}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{settings.promo_banner_text}</span>
        </div>
      )}

      {/* 3. HERO CAROUSEL SLIDER */}
      <section className="py-8 md:py-12 max-w-7xl mx-auto px-6 w-full">
        <HeroSlider settings={settings} />
      </section>

      {/* 🚀 . ABOUT US SECTION */}
      {(settings.show_about ?? true) && <AboutSection settings={settings} />}

      {/* 🚀 4. HOW IT WORKS (Toggled from Admin) */}
      {(settings.show_how_it_works ?? true) && <HowItWorks settings={settings} />}

      {/* 🚀 5. FEATURED FAVORITES (Toggled from Admin) */}
      {(settings.show_featured ?? true) && (
        <section id="featured" className="py-16 bg-zinc-900/40 border-y border-zinc-800/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-white">Customer Favorites</h2>
                <p className="text-zinc-400 text-sm mt-1">Our top 4 products freshly prepared on demand</p>
              </div>
              <Link
                href="/order"
                className="hover:underline text-sm font-semibold flex items-center gap-1"
                style={{ color: primaryColor }}
              >
                Full Menu <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product: Product) => (
                <div
                  key={product.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-zinc-700 transition"
                >
                  <div className="relative h-48 w-full bg-zinc-800">
                    <Image
                      src={getImageUrl(product.image_path)}
                      alt={product.name}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {product.category_name && (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider block"
                          style={{ color: primaryColor }}
                        >
                          {product.category_name}
                        </span>
                      )}
                      <h3 className="font-bold text-lg text-white mt-0.5">{product.name}</h3>
                      <p
                        className="text-zinc-400 text-xs mt-1 line-clamp-2"
                        dangerouslySetInnerHTML={{
                          __html: product.description || 'Prepared fresh on demand.',
                        }}
                      />
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="font-extrabold text-lg" style={{ color: primaryColor }}>
                        €{formatPrice(product.price || (product as any).unit_price)}
                      </span>
                      <Link
                        href="/order"
                        className="text-zinc-950 text-xs font-black px-4 py-2 rounded-xl transition"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Order
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 🚀 6. WHY CHOOSE US (Toggled from Admin) */}
      {(settings.show_why_choose_us ?? true) && <WhyChooseUs settings={settings} />}

      {/* 🚀 7. PROMO NEWSLETTER BANNER (Toggled from Admin) */}
      {(settings.show_newsletter ?? true) && <NewsletterBanner settings={settings} />}

      {/* 🚀 8. FAQ SECTION (Toggled from Admin) */}
      {(settings.show_faq ?? true) && (
        <section id="faq">
          <FaqSection settings={settings} />
        </section>
      )}

      {/* 🚀 9. CONTACT SECTION (Toggled from Admin) */}
      {(settings.show_contact ?? true) && <ContactSection settings={settings} />}

      {/* 🚀 10. DYNAMIC FOOTER */}
      <footer className="bg-zinc-950 border-t border-zinc-800 py-8 text-center text-xs text-zinc-500 space-y-2">
        <p className="font-bold text-zinc-400">{settings.hero_title || 'Burger Palace Bordeaux'}</p>
        <p>
          {settings.contact_address} — {settings.contact_phone}
        </p>
        <p className="text-[11px] text-zinc-600">
          © {new Date().getFullYear()} {settings.hero_title}. All rights reserved. SIRET: 892 143 567 00012
        </p>
      </footer>
    </div>
  );
}
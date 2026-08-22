'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import {
  ShoppingBag,
  Menu,
  X,
  User as UserIcon,
  Home,
  Utensils,
  HelpCircle,
  PhoneCall,
  Armchair,
} from 'lucide-react';
import { SiteSettings } from '@/types';

export default function Navbar({ settings }: { settings?: SiteSettings }) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const primaryColor = settings?.primary_color || '#f59e0b';

  return (
    <nav className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        
        {/* 🚀 DYNAMIC BRAND LOGO & TITLE */}
        <Link href="/" className="flex items-center gap-2.5">
          {settings?.logo_url ? (
            <Image
              src={settings.logo_url}
              alt={settings.hero_title || 'Logo'}
              width={36}
              height={36}
              unoptimized
              className="object-contain rounded-xl"
            />
          ) : (
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-zinc-950 font-black text-base sm:text-xl shadow-md shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              BP
            </div>
          )}
          <span className="text-base sm:text-xl font-extrabold tracking-tight text-white">
            {settings?.hero_title || 'Burger Palace'}
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-zinc-300">
          <Link href="#about" className="hover:text-white transition">About</Link>
          <Link href="#featured" className="hover:text-white transition">Menu</Link>
          <Link href="/reservation" className="hover:text-white transition flex items-center gap-1">
            <span>Book Table</span>
          </Link>
          <Link href="#faq" className="hover:text-white transition">FAQ</Link>
          <Link href="#contact" className="hover:text-white transition">Contact</Link>
          
          {session ? (
            <Link
              href="/client/profile"
              className="font-extrabold hover:underline transition"
              style={{ color: primaryColor }}
            >
              My Account
            </Link>
          ) : (
            <Link href="/client/login" className="hover:text-white transition">
              Sign In
            </Link>
          )}
        </div>

        {/* Action Buttons & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/reservation"
            className="hidden lg:flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 px-3.5 py-2 rounded-full font-extrabold text-xs transition"
          >
            <Armchair className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span>Table Booking</span>
          </Link>

          <Link
            href="/order"
            className="text-zinc-950 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-black text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition shadow-md hover:brightness-110"
            style={{ backgroundColor: primaryColor }}
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Order Online</span>
          </Link>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-xl transition"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Slide-Down Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden bg-zinc-950 border-b border-zinc-800 px-6 py-6 space-y-3 animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-2 font-bold text-xs">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 text-white"
            >
              <Home className="w-4 h-4" style={{ color: primaryColor }} /> Home
            </Link>

            <Link
              href="/order"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl text-zinc-300 hover:bg-zinc-900"
            >
              <Utensils className="w-4 h-4" style={{ color: primaryColor }} /> Order Online
            </Link>

            <Link
              href="/reservation"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl text-zinc-300 hover:bg-zinc-900"
            >
              <Armchair className="w-4 h-4" style={{ color: primaryColor }} /> Book a Table
            </Link>

            <a
              href="#faq"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl text-zinc-300 hover:bg-zinc-900"
            >
              <HelpCircle className="w-4 h-4" style={{ color: primaryColor }} /> FAQ
            </a>

            <a
              href="#contact"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl text-zinc-300 hover:bg-zinc-900"
            >
              <PhoneCall className="w-4 h-4" style={{ color: primaryColor }} /> Contact &amp; Location
            </a>

            <Link
              href={session ? '/client/profile' : '/client/login'}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3.5 rounded-xl border font-extrabold mt-2"
              style={{
                backgroundColor: `${primaryColor}15`,
                borderColor: `${primaryColor}40`,
                color: primaryColor,
              }}
            >
              <UserIcon className="w-4 h-4" />
              {session ? 'My Account & Live Tracker' : 'Sign In / Register'}
            </Link>
          </nav>
        </div>
      )}
    </nav>
  );
}
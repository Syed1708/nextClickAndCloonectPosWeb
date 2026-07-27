'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ShoppingBag, Menu, X, User as UserIcon, Home, Utensils, HelpCircle, PhoneCall } from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500 rounded-xl flex items-center justify-center text-zinc-950 font-black text-base sm:text-xl">
            BP
          </div>
          <span className="text-base sm:text-xl font-extrabold tracking-tight text-white">
            Burger Palace
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
          <a href="#about" className="hover:text-amber-400 transition">About</a>
          <a href="#featured" className="hover:text-amber-400 transition">Featured</a>
          <a href="#faq" className="hover:text-amber-400 transition">FAQ</a>
          <a href="#contact" className="hover:text-amber-400 transition">Contact</a>
          {session ? (
            <Link href="/profile" className="text-amber-400 font-bold hover:underline">
              My Account
            </Link>
          ) : (
            <Link href="/login" className="hover:text-amber-400 transition">
              Sign In
            </Link>
          )}
        </div>

        {/* Action Buttons & Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/order"
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full font-extrabold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Order Online</span>
          </Link>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-xl"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Slide-Down Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden bg-zinc-950 border-b border-zinc-800 px-6 py-6 space-y-4 animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-3 font-semibold text-sm">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 text-white"
            >
              <Home className="w-4 h-4 text-amber-500" /> Home
            </Link>
            <a
              href="#featured"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl text-zinc-300 hover:bg-zinc-900"
            >
              <Utensils className="w-4 h-4 text-amber-500" /> Featured Menu
            </a>
            <a
              href="#faq"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl text-zinc-300 hover:bg-zinc-900"
            >
              <HelpCircle className="w-4 h-4 text-amber-500" /> FAQ
            </a>
            <a
              href="#contact"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl text-zinc-300 hover:bg-zinc-900"
            >
              <PhoneCall className="w-4 h-4 text-amber-500" /> Contact & Location
            </a>
            <Link
              href={session ? '/profile' : '/login'}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl text-amber-400 bg-amber-500/10 border border-amber-500/30 font-bold"
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
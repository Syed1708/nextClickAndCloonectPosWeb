'use client';

import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { SiteSettings } from '@/types';

export default function ContactSection({ settings }: { settings?: SiteSettings }) {
  const primaryColor = settings?.primary_color || '#f59e0b';
  const mapIframe = settings?.google_maps_iframe || '';
  const isIframeHtml = mapIframe.includes('<iframe');

  return (
    <section id="contact" className="py-16 max-w-7xl mx-auto px-6 w-full">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8 shadow-2xl">
        {/* Left: Contact Info */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider block" style={{ color: primaryColor }}>
              Visit &amp; Contact Us
            </span>
            <h2 className="text-3xl font-black text-white mt-1">Get in Touch</h2>
            <p className="text-zinc-400 text-sm mt-2">
              We look forward to welcoming you for fresh, gourmet burgers and artisanal sides in Bordeaux.
            </p>
          </div>

          <div className="space-y-4 text-sm text-zinc-300 font-medium">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 shrink-0">
                <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
              <span>{settings?.contact_address || '12 Rue Sainte-Catherine, 33000 Bordeaux'}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 shrink-0">
                <Phone className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
              <span>{settings?.contact_phone || '+33 5 56 00 00 00'}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 shrink-0">
                <Mail className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
              <span>{settings?.contact_email || 'contact@burgerpalace.fr'}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 shrink-0">
                <Clock className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
              <span>Opening Hours: {settings?.schedule || '10:00 - 14:30 & 18:30 - 22:30'}</span>
            </div>
          </div>
        </div>

        {/* Right: Dynamic Google Maps Embed */}
        <div className="relative h-64 lg:h-full min-h-70 w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner">
          {mapIframe ? (
            isIframeHtml ? (
              <div
                className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0"
                dangerouslySetInnerHTML={{ __html: mapIframe }}
              />
            ) : (
              <iframe
                src={mapIframe}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs font-bold gap-2 p-6 text-center">
              <MapPin className="w-8 h-8 text-zinc-700" />
              <span>Google Maps location code can be configured in Admin Settings.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
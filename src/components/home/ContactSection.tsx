'use client';

import { useState } from 'react';
import { MapPin, Phone, Clock, Mail, Send, Check, Loader2 } from 'lucide-react';

export default function ContactSection() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send message to your Laravel API or handle client submission
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Smooth UX delay
      setSent(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-zinc-950 border-b border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
          <span className="text-amber-500 font-bold text-xs uppercase tracking-widest">
            Get In Touch
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Visit Us or Send a Message
          </h2>
          <p className="text-zinc-400 text-sm">
            Have questions about group orders, allergies, or events? We’d love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column: Info Cards & Contact Form */}
          <div className="space-y-8">
            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-start gap-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Our Location</h4>
                  <p className="text-zinc-400 text-xs mt-1">12 Rue Sainte-Catherine, 33000 Bordeaux</p>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-start gap-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Opening Hours</h4>
                  <p className="text-zinc-400 text-xs mt-1">Mon - Sun: 11:30 AM - 10:30 PM</p>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-start gap-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Phone</h4>
                  <p className="text-zinc-400 text-xs mt-1">+33 5 56 00 11 22</p>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-start gap-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Email Us</h4>
                  <p className="text-zinc-400 text-xs mt-1 truncate">contact@burgerpalace.fr</p>
                </div>
              </div>
            </div>

            {/* Interactive Contact Form */}
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-6">
              <h3 className="text-xl font-bold text-white">Send Us a Direct Message</h3>

              {sent && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl text-xs flex items-center gap-2 font-semibold">
                  <Check className="w-4 h-4" /> Thank you! Your message has been sent successfully.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Jean Dupont"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jean@example.com"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Your Message</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can we help you today?"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-amber-500 transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-8 py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition w-full sm:w-auto disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Message
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Google Maps Embed */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden h-145 relative">
            <iframe
              title="Burger Palace Bordeaux Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2829.136015093125!2d-0.5750000!3d44.8377780!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd5527ca3e7f45a1%3A0x406d34e4f342410!2sRue%20Sainte-Catherine%2C%2033000%20Bordeaux!5e0!3m2!1sen!2sfr!4v1680000000000!5m2!1sen!2sfr"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'grayscale(0.85) contrast(1.2) invert(0.9)' }}
              allowFullScreen={false}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
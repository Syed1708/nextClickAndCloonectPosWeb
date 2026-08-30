import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { fetchSiteSettings } from "@/lib/api";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 🚀 DYNAMIC FAVICON & METADATA FROM LARAVEL CMS
// export async function generateMetadata(): Promise<Metadata> {
//   const settings = await fetchSiteSettings();
  
//   // Use uploaded favicon URL or fallback to /favicon.svg
//   const faviconUrl = settings?.favicon_url;

//  return {
//     title: settings.hero_title || 'Burger Palace Bordeaux',
//     description: settings.hero_subtitle || 'Gourmet Artisanal Burgers & Click & Collect',
//     icons: [
//       {
//         rel: 'icon',
//         url: `${faviconUrl}?v=3.0`, // 🚀 Supports JPG, PNG, and SVG dynamically!
//       },
//       {
//         rel: 'shortcut icon',
//         url: `${faviconUrl}?v=3.0`,
//       },
//       {
//         rel: 'apple-touch-icon',
//         url: `${faviconUrl}?v=3.0`,
//       },
//     ],
//   };
// }

export default function RootLayout({
  
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
                <Providers>
                  {children}
                  {modal}
                </Providers>

      </body>
    </html>
  );
}

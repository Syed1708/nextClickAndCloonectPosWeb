/** @type {import('next').NextConfig} */
import type { NextConfig } from "next";


const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Add your production Laravel domain here later
    ],
    
    // https://images.unsplash.com
  },
};


export default nextConfig;

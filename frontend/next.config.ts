import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/public/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: 'http://localhost:3001/auth/:path*',
      },
      {
        source: '/admin/auth/:path*',
        destination: 'http://localhost:3001/admin/auth/:path*',
      },
      {
        source: '/admin/ping',
        destination: 'http://localhost:3001/admin/ping',
      },
      {
        source: '/settings/:path*',
        destination: 'http://localhost:3001/settings/:path*',
      },
      {
        source: '/orders/:path*',
        destination: 'http://localhost:3001/orders/:path*',
      },
      {
        source: '/products/:path*',
        destination: 'http://localhost:3001/products/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:3001/uploads/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
      {
        source: '/public/:path*',
        destination: 'http://localhost:3001/public/:path*',
      },
    ];
  },
};

export default nextConfig;

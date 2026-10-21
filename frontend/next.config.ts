
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    const backend = 'http://127.0.0.1:3001';

    return [
      {
        source: '/auth/:path*',
        destination: `${backend}/auth/:path*`,
      },
      {
        source: '/users/:path*',
        destination: `${backend}/users/:path*`,
      },
      {
        source: '/destinations/:path*',
        destination: `${backend}/destinations/:path*`,
      },
      {
        source: '/packages/:path*',
        destination: `${backend}/packages/:path*`,
      },
      {
        source: '/reviews/:path*',
        destination: `${backend}/reviews/:path*`,
      },
      {
        source: '/travel-plans/:path*',
        destination: `${backend}/travel-plans/:path*`,
      },
      {
        source: '/bookings/:path*',
        destination: `${backend}/bookings/:path*`,
      },
      {
        source: '/payments/:path*',
        destination: `${backend}/payments/:path*`,
      },
      {
        source: '/wishlist/:path*',
        destination: `${backend}/wishlist/:path*`,
      },
      {
        source: '/admin-dashboard/:path*',
        destination: `${backend}/admin-dashboard/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backend}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;

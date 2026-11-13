import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { getSiteUrl } from './src/lib/seo/urls';

// Validate before building/starting, even when a page catches metadata errors.
const siteUrl = getSiteUrl();

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Camera/microphone are never used; geolocation stays allowed (checkout location picker).
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), browsing-topics=()' },
  ...(process.env.NODE_ENV === 'production' && siteUrl.protocol === 'https:'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }]
    : []),
];

// Un-hashed files in /public: one week of browser cache, refreshed in the background.
const STATIC_MEDIA = ['/videos/:path*', '/brands/:path*', '/product-fallbacks/:path*', '/utility-types/:path*', '/payments/:path*', '/hero/:path*'];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      ...STATIC_MEDIA.map((source) => ({
        source,
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      })),
    ];
  },
  async rewrites() {
    return [{ source: '/sitemap-:file.xml', destination: '/sitemaps/:file.xml' }];
  },
  async redirects() {
    return siteUrl.hostname === 'boukirdiamond.com' ? [{
      source: '/:path*',
      has: [{ type: 'host' as const, value: 'www.boukirdiamond.com' }],
      destination: `${siteUrl.origin}/:path*`,
      permanent: true,
    }] : [];
  },
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default withNextIntl(nextConfig);

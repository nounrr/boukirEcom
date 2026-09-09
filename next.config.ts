import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { getSiteUrl } from './src/lib/seo/urls';

// Validate before building/starting, even when a page catches metadata errors.
const siteUrl = getSiteUrl();

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
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

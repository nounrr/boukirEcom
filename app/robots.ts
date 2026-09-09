import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/seo/metadata'

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl()
  const privatePaths = ['checkout', 'cart', 'orders', 'profile', 'wishlist', 'login', 'register', 'forgot-password', 'activate-account', 'service-requests', 'solde-historique']
  return {
    rules: [{
      userAgent: '*', allow: '/',
      disallow: ['/api/', ...['', '/fr', '/ar', '/en', '/zh'].flatMap(prefix =>
        privatePaths.flatMap(path => [`${prefix}/${path}$`, `${prefix}/${path}/`, `${prefix}/${path}?`])
      )],
    }],
    sitemap: new URL('/sitemap.xml', site).toString(),
    host: site.origin,
  }
}

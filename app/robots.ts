import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dashboard', '/messages', '/settings'],
    },
    sitemap: 'https://khidma.dz/sitemap.xml',
  }
}

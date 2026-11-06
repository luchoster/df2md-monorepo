import type { MetadataRoute } from 'next'
import { siteOrigin } from '@/lib/site-url'

/** Signed-in, transactional and API paths: nothing there is worth indexing. */
const disallow = [
  '/account',
  '/account/',
  '/cart',
  '/checkout',
  '/checkout/',
  '/api/',
  '/auth/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/set-password',
  '/thank-you'
]

/** Search engines and assistant crawlers: the same policy, stated per agent so nothing is left to guess. */
const namedAgents = [
  'Googlebot',
  'Bingbot',
  'Applebot',
  'DuckDuckBot',
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'Google-Extended',
  'PerplexityBot',
  'Perplexity-User',
  'CCBot',
  'Amazonbot',
  'Applebot-Extended'
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      { userAgent: namedAgents, allow: '/', disallow }
    ],
    sitemap: `${siteOrigin()}/sitemap.xml`
  }
}

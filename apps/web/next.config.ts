import { join } from 'node:path'
import { loadEnvConfig } from '@next/env'
import type { NextConfig } from 'next'

// Next only reads .env files from apps/web; the monorepo keeps one .env at the root.
loadEnvConfig(join(process.cwd(), '..', '..'))

const nextConfig: NextConfig = {
  images: {
    // Every image goes through next-sanity/image (Sanity CDN loader); nothing else is optimized.
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }]
  },
  logging: { fetches: { fullUrl: process.env.NODE_ENV === 'development' } }
}

export default nextConfig

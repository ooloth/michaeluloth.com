import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true, // see: https://nextjs.org/blog/next-16#cache-components
  experimental: {
    turbopackFileSystemCacheForDev: true, // see: https://nextjs.org/blog/next-16#turbopack-file-system-caching-beta
  },
}

export default nextConfig

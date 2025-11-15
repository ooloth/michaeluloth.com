import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  trailingSlash: true, // match Astro site norms (which I think apply to RSS feed URLs too)
}

export default nextConfig

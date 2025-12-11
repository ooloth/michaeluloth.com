import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  trailingSlash: true, // match Astro site norms (which I think apply to RSS feed URLs too)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
}

export default nextConfig

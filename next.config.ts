import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  staticPageGenerationTimeout: 180, // Increase timeout for pages with slow external API calls (likes page)
  images: {
    unoptimized: true, // Required for static exports - no image optimization server
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  trailingSlash: true, // match Astro site norms (which I think apply to RSS feed URLs too)
  turbopack: {
    rules: {
      // See: https://github.com/vitalets/turbopack-inline-svg-loader?tab=readme-ov-file#configuration
      '*.svg': {
        loaders: ['turbopack-inline-svg-loader'],
        condition: {
          content: /^[\s\S]{0,4000}$/, // <-- Inline SVGs smaller than ~4Kb (since Next.js v16)
        },
        as: '*.js',
      },
    },
  },
}

export default nextConfig

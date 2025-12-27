import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Required for static exports - no image optimization server
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  output: 'export', // NOTE: temporarily disable this to be able to see the 404 page while dev server is running
  staticPageGenerationTimeout: 180, // Increase timeout for pages with slow external API calls (likes page)
  trailingSlash: true, // change links `/me` -> `/me/` and emit `/me.html` -> `/me/index.html`
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

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Amp sets PUBLIC_URL only for orb portal services; allow that one host to reach dev resources
  // such as HMR. Elsewhere (e.g. local dev) it is unset, so Next's default blocking applies.
  allowedDevOrigins: process.env.PUBLIC_URL ? [new URL(process.env.PUBLIC_URL).hostname] : [],
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
  // One page makes up to three Notion calls in a row, each of which may wait out a 90s rate-limit
  // pause twice (io/notion/rateLimit.ts), so allow 600s; CI stops the whole build at 15 minutes
  staticPageGenerationTimeout: 600,
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

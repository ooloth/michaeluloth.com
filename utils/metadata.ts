/**
 * Shared metadata constants for SEO and social sharing.
 * Used across layouts, generateMetadata functions, and feeds.
 */

/**
 * Site URL with trailing slash.
 * IMPORTANT: The trailing slash ensures consistent URL formatting across
 * sitemap, robots.txt, and RSS feed. All page URLs use trailing slashes.
 */
export const SITE_URL = 'https://michaeluloth.com/'

export const SITE_NAME = 'Michael Uloth'

export const SITE_DESCRIPTION = 'Software engineer helping scientists discover new medicines at Recursion.'

export const SITE_AUTHOR = 'Michael Uloth'

/**
 * Default OpenGraph image (1200x630px).
 * Generated via metadata/generate-og-image.ts from:
 * - Photo: Cloudinary (michael-landscape.jpg, color)
 * - Text: "Michael Uloth" in Inter Bold
 * - Background: zinc-900 (#18181b)
 * - Accent: pink underline (#ff98a4)
 *
 * Regenerate: npm run generate:og-image
 */
export const DEFAULT_OG_IMAGE = '/og-image.png'

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

/**
 * The site name displayed in OpenGraph metadata and social sharing cards.
 * Used in og:site_name and as the default title suffix.
 */
export const SITE_NAME = 'Michael Uloth'

/**
 * The default site description shown in meta tags and social previews.
 * Used when a page doesn't have a specific description.
 */
export const SITE_DESCRIPTION = 'Software engineer helping scientists discover new medicines at Recursion.'

/**
 * The author name used in article metadata and JSON-LD structured data.
 * Referenced in article:author tags and schema.org Person entities.
 */
export const SITE_AUTHOR = 'Michael Uloth'

/**
 * Twitter handle for social sharing metadata.
 * Used in twitter:creator meta tags for Twitter Cards.
 */
export const TWITTER_HANDLE = '@ooloth'

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

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

export const SITE_DESCRIPTION =
  'Software engineer helping scientists discover new medicines at Recursion.'

export const SITE_AUTHOR = 'Michael Uloth'

/**
 * Default OpenGraph image path (relative to public directory).
 * Used when a page doesn't have a specific OG image.
 */
export const DEFAULT_OG_IMAGE = '/og-image.png'

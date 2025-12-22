/**
 * Shared configuration for validation scripts.
 */

import { join } from 'path'

// ============================================================================
// Site Configuration
// ============================================================================

/**
 * Production site URL. Used for validating canonical URLs and OG image URLs.
 *
 * TODO: Consider sourcing from env var or build config to support preview deployments.
 */
export const SITE_URL = 'https://michaeluloth.com/'

// ============================================================================
// Build Paths
// ============================================================================

/**
 * Directory containing the static build output (Next.js export).
 */
export const OUT_DIR = join(process.cwd(), 'out')

/**
 * Directory containing Lighthouse CI reports.
 */
export const LHCI_DIR = join(process.cwd(), '.lighthouseci')

// ============================================================================
// Metadata Validation
// ============================================================================

/**
 * Static pages to validate (non-dynamic routes).
 */
export const STATIC_PAGES = [
  { file: 'index.html', name: 'Homepage' },
  { file: 'blog/index.html', name: 'Blog' },
  { file: 'likes/index.html', name: 'Likes' },
] as const

/**
 * Required OpenGraph meta tags for all pages.
 */
export const REQUIRED_OG_TAGS = [
  'og:title',
  'og:image',
  'og:url',
  'og:type',
  'og:site_name',
  'og:locale',
] as const

/**
 * Required OpenGraph meta tags for article pages (og:type="article").
 */
export const REQUIRED_ARTICLE_TAGS = [
  'article:published_time',
  'article:modified_time',
  'article:author',
] as const

/**
 * Required Twitter Card meta tags.
 */
export const REQUIRED_TWITTER_TAGS = [
  'twitter:card',
  'twitter:creator',
  'twitter:title',
  'twitter:image',
] as const

/**
 * Directories to exclude when discovering blog posts.
 * These are not blog post content directories.
 */
export const EXCLUDE_DIRS = new Set([
  'blog',
  'likes',
  '_next',
  'api',
  '404',
  '_not-found',
])

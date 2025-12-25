#!/usr/bin/env tsx
/**
 * Generates Lighthouse CI URLs dynamically based on blog posts.
 *
 * WHY THIS EXISTS:
 * Hard-coding post URLs in lighthouserc.cjs falls out of date immediately as new posts are published.
 * This script reads the RSS feed (already sorted by publish date) to select posts for testing:
 * - Latest post (always tested - catches issues in new content)
 * - 1 random post (provides coverage across different posts over time)
 *
 * USAGE:
 * Runs automatically before `npm run lighthouse` via the "prelighthouse" script in package.json.
 * You rarely need to run it manually. If you do: tsx ci/lighthouse/generate-urls.ts
 */

import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const OUT_DIR = join(process.cwd(), 'out')
const RSS_PATH = join(OUT_DIR, 'rss.xml')
const OUTPUT_PATH = join(process.cwd(), 'ci/lighthouse', 'urls.json')

// ============================================================================
// Pure Functions (no I/O, easily testable)
// ============================================================================

/**
 * Extract all post slugs from RSS feed XML.
 * RSS feed is already sorted by publication date (newest first).
 *
 * @example
 * const xml = '<rss>...<link>https://michaeluloth.com/my-post/</link>...</rss>'
 * extractPostSlugsFromRss(xml) // ['my-post', 'another-post', ...]
 */
export function extractPostSlugsFromRss(xml: string, limit?: number): string[] {
  // Match <link> tags containing blog post URLs
  const linkRegex = /<link>https:\/\/michaeluloth\.com\/(.*?)\/<\/link>/g
  const matches = [...xml.matchAll(linkRegex)]

  // Extract slugs from matched URLs
  const slugs = matches
    .map(match => match[1])
    // Filter out homepage and special pages
    .filter(slug => slug && slug !== '' && !slug.includes('/'))

  return limit !== undefined ? slugs.slice(0, limit) : slugs
}

/**
 * Select posts for Lighthouse testing: latest post + 1 random post.
 * This ensures new posts are always tested while providing coverage across different posts over time.
 *
 * @example
 * selectPostSlugs(['newest', 'older-1', 'older-2', 'oldest'])
 * // Returns: ['newest', <one of: 'older-1', 'older-2', 'oldest'>]
 */
export function selectPostSlugs(allSlugs: string[]): string[] {
  if (allSlugs.length === 0) return []
  if (allSlugs.length === 1) return [allSlugs[0]]

  // Always include the latest post (first in RSS feed)
  const latestPost = allSlugs[0]

  // Randomly select one from the remaining posts
  const remainingPosts = allSlugs.slice(1)
  const randomIndex = Math.floor(Math.random() * remainingPosts.length)
  const randomPost = remainingPosts[randomIndex]

  return [latestPost, randomPost]
}

/**
 * Generate full Lighthouse CI URLs from post slugs.
 *
 * @example
 * generateLighthouseUrls(['my-post', 'another-post'])
 * // Returns array with static pages + ['http://localhost/my-post/index.html', ...]
 */
export function generateLighthouseUrls(postSlugs: string[]): string[] {
  const staticUrls = [
    // Key template variations
    'http://localhost/index.html',
    'http://localhost/blog/index.html',
    'http://localhost/likes/index.html',
    'http://localhost/404/index.html',
    // Note: /_not-found removed - it's identical to /404 (same MD5 hash)
  ]

  const postUrls = postSlugs.map(slug => `http://localhost/${slug}/index.html`)

  return [...staticUrls, ...postUrls]
}

// ============================================================================
// I/O Functions
// ============================================================================

/**
 * Read RSS feed and generate lighthouse-urls.json file.
 * Throws if RSS file doesn't exist or can't be read.
 */
export async function generateLighthouseUrlsFile(): Promise<void> {
  // Read RSS feed (already sorted by date)
  const rss = await readFile(RSS_PATH, 'utf-8')

  // Extract all post slugs
  const allSlugs = extractPostSlugsFromRss(rss)

  if (allSlugs.length === 0) {
    throw new Error('No blog posts found in RSS feed. Build may have failed.')
  }

  // Select posts for testing (latest + 1 random)
  const selectedSlugs = selectPostSlugs(allSlugs)

  // Generate full URLs
  const urls = generateLighthouseUrls(selectedSlugs)

  // Write to JSON file for lighthouserc.cjs to read
  await writeFile(OUTPUT_PATH, JSON.stringify(urls, null, 2) + '\n', 'utf-8')

  console.log(`✓ Generated ${urls.length} Lighthouse URLs (${selectedSlugs.length} posts: latest + random)`)
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
  try {
    await generateLighthouseUrlsFile()
  } catch (error) {
    console.error('❌ Failed to generate Lighthouse URLs:', error)
    process.exit(1)
  }
}

// Only execute main() when this file is run directly (not when imported by tests)
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

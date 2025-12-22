/**
 * Validates OpenGraph and Twitter Card metadata for key pages.
 *
 * Reads static HTML files from build output (out/ directory) and validates:
 * - Required OG tags are present with non-empty values
 * - Required Twitter tags are present with non-empty values
 * - og:image URL is accessible
 * - og:image dimensions are correct (1200x630)
 *
 * Run: npm run build && npm run test:metadata
 */

import { load, type Cheerio } from 'cheerio'
import type { AnyNode } from 'domhandler'
import sharp from 'sharp'
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT } from '@/io/cloudinary/ogImageTransforms'
import { SITE_URL } from '@/utils/metadata'
import {
  OUT_DIR,
  STATIC_PAGES,
  REQUIRED_OG_TAGS,
  REQUIRED_ARTICLE_TAGS,
  REQUIRED_TWITTER_TAGS,
  EXCLUDE_DIRS,
} from './config'

// ============================================================================
// Types
// ============================================================================

interface ValidationError {
  page: string
  error: string
}

interface PageToValidate {
  file: string
  name: string
}

// ============================================================================
// Pure Functions (no I/O, easily testable)
// ============================================================================

/**
 * Check if a URL is valid.
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Check if a date string is valid ISO 8601.
 */
export function isValidISODate(dateString: string): boolean {
  return !isNaN(Date.parse(dateString))
}

/**
 * Infer the expected canonical URL for a page based on its file path.
 */
export function getExpectedCanonicalUrl(file: string): string {
  if (file === 'index.html') return SITE_URL
  const path = file.replace('/index.html', '/')
  return `${SITE_URL}${path}`
}

/**
 * Check if an OG image URL is either the default image or a Cloudinary URL.
 */
export function isValidOgImageUrl(imageUrl: string): boolean {
  const isDefault = imageUrl === `${SITE_URL}og-image.png`
  const isCloudinary = imageUrl.startsWith('https://res.cloudinary.com/')
  return isDefault || isCloudinary
}

/**
 * Check if a Cloudinary URL has the correct OG image dimensions in the transformation.
 */
export function hasCorrectCloudinaryDimensions(imageUrl: string): boolean {
  const expectedDimensions = `w_${OG_IMAGE_WIDTH},h_${OG_IMAGE_HEIGHT}`
  return imageUrl.includes(expectedDimensions)
}

// ============================================================================
// HTML Parsing Functions (testable with sample HTML)
// ============================================================================

/**
 * Extract meta tag content from Cheerio element.
 */
function getMetaContent(element: Cheerio<AnyNode>): string | undefined {
  const content = element.attr('content')
  return content && content.trim() !== '' ? content : undefined
}

/**
 * Validate required meta tags are present and have content.
 */
function validateRequiredTags(
  $: ReturnType<typeof load>,
  tags: readonly string[],
  selector: (tag: string) => string,
  pageName: string,
  tagType: string
): ValidationError[] {
  const errors: ValidationError[] = []

  for (const tag of tags) {
    const element = $(selector(tag))
    const content = getMetaContent(element)

    if (!element.length) {
      errors.push({ page: pageName, error: `Missing required ${tagType} tag: ${tag}` })
    } else if (!content) {
      errors.push({ page: pageName, error: `Empty content for ${tagType} tag: ${tag}` })
    }
  }

  return errors
}

/**
 * Validate OpenGraph meta tags in HTML.
 */
function validateOgTags(html: string, pageName: string, expectedUrl: string): ValidationError[] {
  const $ = load(html)
  const errors: ValidationError[] = []

  // Check required OG tags
  errors.push(...validateRequiredTags($, REQUIRED_OG_TAGS, tag => `meta[property="${tag}"]`, pageName, 'OG'))

  // Validate og:url
  const ogUrl = getMetaContent($('meta[property="og:url"]'))
  if (ogUrl) {
    if (!isValidUrl(ogUrl)) {
      errors.push({ page: pageName, error: `og:url is not a valid URL: ${ogUrl}` })
    } else if (ogUrl !== expectedUrl) {
      errors.push({
        page: pageName,
        error: `og:url does not match expected canonical URL. Expected: ${expectedUrl}, Got: ${ogUrl}`,
      })
    }
  }

  // Validate og:image
  const ogImage = getMetaContent($('meta[property="og:image"]'))
  if (ogImage) {
    if (!isValidUrl(ogImage)) {
      errors.push({ page: pageName, error: `og:image is not a valid URL: ${ogImage}` })
    } else if (!isValidOgImageUrl(ogImage)) {
      errors.push({
        page: pageName,
        error: `og:image must be either the default OG image or a Cloudinary URL. Got: ${ogImage}`,
      })
    } else if (ogImage.startsWith('https://res.cloudinary.com/') && !hasCorrectCloudinaryDimensions(ogImage)) {
      const expected = `w_${OG_IMAGE_WIDTH},h_${OG_IMAGE_HEIGHT}`
      errors.push({
        page: pageName,
        error: `Cloudinary og:image must include correct dimensions (${expected}). Got: ${ogImage}`,
      })
    }
  }

  // Validate og:type
  const ogType = getMetaContent($('meta[property="og:type"]'))
  if (ogType && !['website', 'article'].includes(ogType)) {
    errors.push({
      page: pageName,
      error: `og:type has invalid value: ${ogType} (expected "website" or "article")`,
    })
  }

  // Validate article-specific tags
  if (ogType === 'article') {
    errors.push(
      ...validateRequiredTags($, REQUIRED_ARTICLE_TAGS, tag => `meta[property="${tag}"]`, pageName, 'article')
    )

    // Validate article dates
    const publishedTime = getMetaContent($('meta[property="article:published_time"]'))
    if (publishedTime && !isValidISODate(publishedTime)) {
      errors.push({ page: pageName, error: `article:published_time is not a valid date: ${publishedTime}` })
    }

    const modifiedTime = getMetaContent($('meta[property="article:modified_time"]'))
    if (modifiedTime && !isValidISODate(modifiedTime)) {
      errors.push({ page: pageName, error: `article:modified_time is not a valid date: ${modifiedTime}` })
    }
  }

  return errors
}

/**
 * Validate Twitter Card meta tags in HTML.
 */
function validateTwitterTags(html: string, pageName: string): ValidationError[] {
  const $ = load(html)
  const errors: ValidationError[] = []

  // Check required Twitter tags
  errors.push(...validateRequiredTags($, REQUIRED_TWITTER_TAGS, tag => `meta[name="${tag}"]`, pageName, 'Twitter'))

  // Validate twitter:card value
  const twitterCard = getMetaContent($('meta[name="twitter:card"]'))
  if (twitterCard && twitterCard !== 'summary_large_image') {
    errors.push({
      page: pageName,
      error: `twitter:card has invalid value: ${twitterCard} (expected "summary_large_image")`,
    })
  }

  // Validate twitter:image matches og:image
  const twitterImage = getMetaContent($('meta[name="twitter:image"]'))
  const ogImage = getMetaContent($('meta[property="og:image"]'))

  if (twitterImage) {
    if (!isValidUrl(twitterImage)) {
      errors.push({ page: pageName, error: `twitter:image is not a valid URL: ${twitterImage}` })
    } else if (ogImage && twitterImage !== ogImage) {
      errors.push({
        page: pageName,
        error: `twitter:image must match og:image. Expected: ${ogImage}, Got: ${twitterImage}`,
      })
    }
  }

  return errors
}

// ============================================================================
// I/O Functions
// ============================================================================

/**
 * Find all blog post directories in the build output.
 */
async function findBlogPosts(): Promise<string[]> {
  try {
    const entries = await readdir(OUT_DIR, { withFileTypes: true })
    const posts: string[] = []

    for (const entry of entries.filter(e => e.isDirectory())) {
      if (EXCLUDE_DIRS.has(entry.name)) continue

      try {
        await readFile(join(OUT_DIR, entry.name, 'index.html'))
        posts.push(`${entry.name}/index.html`)
      } catch {
        continue
      }
    }

    return posts
  } catch (error) {
    console.warn('Could not find blog posts for validation:', error)
    return []
  }
}

/**
 * Fetch and validate OG image dimensions.
 */
async function validateOgImage(html: string, pageName: string): Promise<ValidationError[]> {
  const $ = load(html)
  const imageUrl = getMetaContent($('meta[property="og:image"]'))

  if (!imageUrl) return []

  // Skip Cloudinary images (dimensions already validated in URL)
  if (imageUrl.startsWith('https://res.cloudinary.com/')) return []

  try {
    let buffer: ArrayBuffer

    // Local image
    if (imageUrl.startsWith(SITE_URL)) {
      const imagePath = imageUrl.replace(SITE_URL, '')
      const localPath = join(OUT_DIR, imagePath)

      try {
        const fileBuffer = await readFile(localPath)
        buffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength)
      } catch {
        return [{ page: pageName, error: `og:image file not found: ${imagePath} (expected at ${localPath})` }]
      }
    } else {
      // External image - fetch with timeout
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      try {
        const response = await fetch(imageUrl, { signal: controller.signal })
        clearTimeout(timeout)

        if (!response.ok) {
          return [{ page: pageName, error: `og:image not accessible: ${imageUrl} (${response.status})` }]
        }

        buffer = await response.arrayBuffer()
      } catch (fetchError) {
        clearTimeout(timeout)
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return [{ page: pageName, error: `og:image fetch timed out: ${imageUrl}` }]
        }
        throw fetchError
      }
    }

    // Validate dimensions
    const metadata = await sharp(Buffer.from(buffer)).metadata()

    if (metadata.width !== OG_IMAGE_WIDTH || metadata.height !== OG_IMAGE_HEIGHT) {
      return [
        {
          page: pageName,
          error: `og:image has wrong dimensions: ${metadata.width}x${metadata.height} (expected ${OG_IMAGE_WIDTH}x${OG_IMAGE_HEIGHT})`,
        },
      ]
    }

    return []
  } catch (error) {
    return [
      {
        page: pageName,
        error: `Failed to validate og:image: ${error instanceof Error ? error.message : String(error)}`,
      },
    ]
  }
}

/**
 * Validate a single page.
 */
async function validatePage(file: string, name: string): Promise<ValidationError[]> {
  const filePath = join(OUT_DIR, file)
  const expectedUrl = getExpectedCanonicalUrl(file)
  const errors: ValidationError[] = []

  console.log(`Validating ${name}: ${file}`)

  try {
    const html = await readFile(filePath, 'utf-8')

    errors.push(...validateOgTags(html, name, expectedUrl))
    errors.push(...validateTwitterTags(html, name))
    errors.push(...(await validateOgImage(html, name)))
  } catch (error) {
    errors.push({
      page: name,
      error: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
    })
  }

  return errors
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function validateMetadata() {
  try {
    const pages: PageToValidate[] = [...STATIC_PAGES]

    // Find and add blog posts
    const blogPostFiles = await findBlogPosts()
    if (blogPostFiles.length > 0) {
      for (const file of blogPostFiles) {
        const postSlug = file.replace('/index.html', '')
        pages.push({ file, name: `Article: ${postSlug}` })
      }
      console.log(`Found ${blogPostFiles.length} blog post(s) for validation`)
    } else {
      console.warn('⚠️  No blog posts found for validation - skipping article metadata checks')
    }

    // Validate all pages
    const allErrors: ValidationError[] = []
    for (const page of pages) {
      const pageErrors = await validatePage(page.file, page.name)
      allErrors.push(...pageErrors)
    }

    // Report results
    console.log('\n' + '='.repeat(50))
    if (allErrors.length === 0) {
      console.log('✅ All metadata validation checks passed!')
      process.exit(0)
    } else {
      console.log(`❌ Found ${allErrors.length} validation error(s):\n`)
      for (const error of allErrors) {
        console.log(`  ${error.page}:`)
        console.log(`    ${error.error}\n`)
      }
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Validation failed:', error)
    process.exit(1)
  }
}

validateMetadata()

/**
 * Validates OpenGraph metadata and images for key pages.
 *
 * Reads static HTML files from build output (out/ directory) and validates:
 * - Required OG tags are present with non-empty values
 * - og:image URL is accessible
 * - og:image dimensions are correct (1200x630)
 *
 * Run: npm run build && npm run test:metadata
 */

import { load } from 'cheerio'
import sharp from 'sharp'
import { readFile } from 'fs/promises'
import { join } from 'path'

// Pages to validate (minimal scope)
const PAGES = [
  { file: 'index.html', name: 'Homepage' },
  { file: 'blog/index.html', name: 'Blog' },
  { file: 'likes/index.html', name: 'Likes' },
  { file: 'git-undo-merge-to-main/index.html', name: 'Post Example' },
]

// Required OG tags
const REQUIRED_OG_TAGS = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type']

interface ValidationError {
  page: string
  error: string
}

const errors: ValidationError[] = []

/**
 * Validates OG meta tags in HTML
 */
function validateOgTags(html: string, pageName: string): void {
  const $ = load(html)

  // Check required OG tags
  for (const tag of REQUIRED_OG_TAGS) {
    const element = $(`meta[property="${tag}"]`)
    const content = element.attr('content')

    if (!element.length) {
      errors.push({ page: pageName, error: `Missing required tag: ${tag}` })
    } else if (!content || content.trim() === '') {
      errors.push({ page: pageName, error: `Empty content for tag: ${tag}` })
    }
  }
}

/**
 * Validates og:image is accessible and has correct dimensions
 */
async function validateOgImage(html: string, pageName: string): Promise<void> {
  const $ = load(html)
  const imageUrl = $('meta[property="og:image"]').attr('content')

  if (!imageUrl) {
    return // Already caught by validateOgTags
  }

  try {
    let buffer: ArrayBuffer

    // Check if it's a local image (michaeluloth.com domain)
    if (imageUrl.startsWith('https://michaeluloth.com/')) {
      // Extract path and read from local out/ directory
      const imagePath = imageUrl.replace('https://michaeluloth.com/', '')
      const localPath = join(process.cwd(), 'out', imagePath)

      try {
        const fileBuffer = await readFile(localPath)
        buffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength)
      } catch (error) {
        errors.push({
          page: pageName,
          error: `og:image file not found: ${imagePath} (expected at ${localPath})`,
        })
        return
      }
    } else {
      // External image - fetch from URL
      const response = await fetch(imageUrl)
      if (!response.ok) {
        errors.push({
          page: pageName,
          error: `og:image not accessible: ${imageUrl} (${response.status})`,
        })
        return
      }
      buffer = await response.arrayBuffer()
    }

    // Validate dimensions
    const metadata = await sharp(Buffer.from(buffer)).metadata()

    if (metadata.width !== 1200 || metadata.height !== 630) {
      errors.push({
        page: pageName,
        error: `og:image has wrong dimensions: ${metadata.width}x${metadata.height} (expected 1200x630)`,
      })
    }
  } catch (error) {
    errors.push({
      page: pageName,
      error: `Failed to validate og:image: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}

/**
 * Validates a single page
 */
async function validatePage(file: string, name: string): Promise<void> {
  const filePath = join(process.cwd(), 'out', file)
  console.log(`Validating ${name}: ${file}`)

  try {
    const html = await readFile(filePath, 'utf-8')

    validateOgTags(html, name)
    await validateOgImage(html, name)
  } catch (error) {
    errors.push({
      page: name,
      error: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}

/**
 * Main validation function
 */
async function validateMetadata() {
  try {
    // Validate all pages
    for (const page of PAGES) {
      await validatePage(page.file, page.name)
    }

    // Report results
    console.log('\n' + '='.repeat(50))
    if (errors.length === 0) {
      console.log('✅ All metadata validation checks passed!')
      process.exit(0)
    } else {
      console.log(`❌ Found ${errors.length} validation error(s):\n`)
      for (const error of errors) {
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

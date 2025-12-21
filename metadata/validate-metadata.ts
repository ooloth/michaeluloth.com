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

import { load } from 'cheerio'
import sharp from 'sharp'
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'

/**
 * Finds the first blog post in the build output for validation.
 * Looks for directories in out/ that contain index.html and aren't special pages.
 */
async function findFirstBlogPost(): Promise<string | null> {
  try {
    const outDir = join(process.cwd(), 'out')
    const entries = await readdir(outDir, { withFileTypes: true })

    // Filter for directories (potential blog posts)
    const directories = entries.filter(entry => entry.isDirectory())

    // Exclude known non-blog directories and Next.js special pages
    const excludeDirs = new Set(['blog', 'likes', '_next', 'api', '404', '_not-found'])

    for (const dir of directories) {
      if (excludeDirs.has(dir.name)) continue

      // Check if this directory has an index.html (confirms it's a static page)
      try {
        const indexPath = join(outDir, dir.name, 'index.html')
        await readFile(indexPath)
        return `${dir.name}/index.html`
      } catch {
        // Not a static page, skip
        continue
      }
    }

    return null
  } catch (error) {
    console.warn('Could not find blog post for validation:', error)
    return null
  }
}

// Pages to validate (minimal scope)
// Note: Blog post will be added dynamically in main function
const STATIC_PAGES = [
  { file: 'index.html', name: 'Homepage' },
  { file: 'blog/index.html', name: 'Blog' },
  { file: 'likes/index.html', name: 'Likes' },
]

// Required OG tags (description is optional - posts may not have one)
const REQUIRED_OG_TAGS = ['og:title', 'og:image', 'og:url', 'og:type', 'og:site_name', 'og:locale']

// Required article-specific OG tags (only for pages where og:type is "article")
const REQUIRED_ARTICLE_TAGS = ['article:published_time', 'article:modified_time', 'article:author']

// Required Twitter tags (description is optional - posts may not have one)
const REQUIRED_TWITTER_TAGS = ['twitter:card', 'twitter:creator', 'twitter:title', 'twitter:image']

interface ValidationError {
  page: string
  error: string
}

const errors: ValidationError[] = []

/**
 * Validates OG meta tags in HTML
 */
function validateOgTags(html: string, pageName: string, expectedUrl: string): void {
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

  // Validate og:url matches expected canonical URL exactly
  const ogUrl = $('meta[property="og:url"]').attr('content')
  if (ogUrl) {
    try {
      new URL(ogUrl)
    } catch {
      errors.push({ page: pageName, error: `og:url is not a valid URL: ${ogUrl}` })
    }

    if (ogUrl !== expectedUrl) {
      errors.push({
        page: pageName,
        error: `og:url does not match expected canonical URL. Expected: ${expectedUrl}, Got: ${ogUrl}`,
      })
    }
  }

  // Validate og:image is a valid URL and matches expected patterns
  const ogImage = $('meta[property="og:image"]').attr('content')
  if (ogImage) {
    try {
      new URL(ogImage)
    } catch {
      errors.push({ page: pageName, error: `og:image is not a valid URL: ${ogImage}` })
    }

    // Check that image is either the default OG image or a Cloudinary URL
    const isDefaultImage = ogImage === 'https://michaeluloth.com/og-image.png'
    const isCloudinaryImage = ogImage.startsWith('https://res.cloudinary.com/')

    if (!isDefaultImage && !isCloudinaryImage) {
      errors.push({
        page: pageName,
        error: `og:image must be either the default OG image or a Cloudinary URL. Got: ${ogImage}`,
      })
    }

    // If Cloudinary, verify it has the OG transformation parameters (1200x630)
    if (isCloudinaryImage && !ogImage.includes('w_1200,h_630')) {
      errors.push({
        page: pageName,
        error: `Cloudinary og:image must include correct dimensions (w_1200,h_630). Got: ${ogImage}`,
      })
    }
  }

  // Validate og:type has valid value
  const ogType = $('meta[property="og:type"]').attr('content')
  if (ogType && !['website', 'article'].includes(ogType)) {
    errors.push({ page: pageName, error: `og:type has invalid value: ${ogType} (expected "website" or "article")` })
  }

  // Check article-specific tags if og:type is "article"
  if (ogType === 'article') {
    for (const tag of REQUIRED_ARTICLE_TAGS) {
      const element = $(`meta[property="${tag}"]`)
      const content = element.attr('content')

      if (!element.length) {
        errors.push({ page: pageName, error: `Missing required article tag: ${tag}` })
      } else if (!content || content.trim() === '') {
        errors.push({ page: pageName, error: `Empty content for article tag: ${tag}` })
      }
    }

    // Validate article dates are valid ISO 8601
    const publishedTime = $('meta[property="article:published_time"]').attr('content')
    if (publishedTime && isNaN(Date.parse(publishedTime))) {
      errors.push({ page: pageName, error: `article:published_time is not a valid date: ${publishedTime}` })
    }

    const modifiedTime = $('meta[property="article:modified_time"]').attr('content')
    if (modifiedTime && isNaN(Date.parse(modifiedTime))) {
      errors.push({ page: pageName, error: `article:modified_time is not a valid date: ${modifiedTime}` })
    }
  }
}

/**
 * Validates Twitter Card meta tags in HTML
 */
function validateTwitterTags(html: string, pageName: string): void {
  const $ = load(html)

  // Check required Twitter tags
  for (const tag of REQUIRED_TWITTER_TAGS) {
    const element = $(`meta[name="${tag}"]`)
    const content = element.attr('content')

    if (!element.length) {
      errors.push({ page: pageName, error: `Missing required tag: ${tag}` })
    } else if (!content || content.trim() === '') {
      errors.push({ page: pageName, error: `Empty content for tag: ${tag}` })
    }
  }

  // Validate twitter:card has valid value
  const twitterCard = $('meta[name="twitter:card"]').attr('content')
  if (twitterCard && twitterCard !== 'summary_large_image') {
    errors.push({
      page: pageName,
      error: `twitter:card has invalid value: ${twitterCard} (expected "summary_large_image")`,
    })
  }

  // Validate twitter:image is a valid URL and matches og:image
  const twitterImage = $('meta[name="twitter:image"]').attr('content')
  const ogImage = $('meta[property="og:image"]').attr('content')

  if (twitterImage) {
    try {
      new URL(twitterImage)
    } catch {
      errors.push({ page: pageName, error: `twitter:image is not a valid URL: ${twitterImage}` })
    }

    // Twitter image should match OpenGraph image
    if (ogImage && twitterImage !== ogImage) {
      errors.push({
        page: pageName,
        error: `twitter:image must match og:image. Expected: ${ogImage}, Got: ${twitterImage}`,
      })
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
 * Infers the expected canonical URL for a page based on its file path
 */
function getExpectedUrl(file: string): string {
  const SITE_URL = 'https://michaeluloth.com/'

  if (file === 'index.html') {
    return SITE_URL
  }

  // Remove /index.html and ensure trailing slash
  const path = file.replace('/index.html', '/')
  return `${SITE_URL}${path}`
}

/**
 * Validates a single page
 */
async function validatePage(file: string, name: string): Promise<void> {
  const filePath = join(process.cwd(), 'out', file)
  const expectedUrl = getExpectedUrl(file)
  console.log(`Validating ${name}: ${file}`)

  try {
    const html = await readFile(filePath, 'utf-8')

    validateOgTags(html, name, expectedUrl)
    validateTwitterTags(html, name)
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
    // Build pages list dynamically
    const pages = [...STATIC_PAGES]

    // Find and add a blog post for validation
    const blogPostFile = await findFirstBlogPost()
    if (blogPostFile) {
      const postSlug = blogPostFile.replace('/index.html', '')
      pages.push({ file: blogPostFile, name: `Post Example (${postSlug})` })
      console.log(`Found blog post for validation: ${postSlug}`)
    } else {
      console.warn('⚠️  No blog post found for validation - skipping article metadata checks')
    }

    // Validate all pages
    for (const page of pages) {
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

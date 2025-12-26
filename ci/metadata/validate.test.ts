import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isValidUrl,
  isValidISODate,
  getExpectedCanonicalUrl,
  isValidOgImageUrl,
  hasCorrectCloudinaryDimensions,
  validateOgImage,
} from './validate'
import { SITE_URL } from '@/seo/constants'

describe('isValidUrl', () => {
  it('returns true for valid absolute URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
    expect(isValidUrl('http://example.com')).toBe(true)
    expect(isValidUrl('https://michaeluloth.com/')).toBe(true)
    expect(isValidUrl('https://res.cloudinary.com/ooloth/image.png')).toBe(true)
  })

  it('returns true for URLs with paths and query params', () => {
    expect(isValidUrl('https://example.com/path/to/page')).toBe(true)
    expect(isValidUrl('https://example.com?query=param')).toBe(true)
    expect(isValidUrl('https://example.com/path?query=param#hash')).toBe(true)
  })

  it('returns false for relative URLs', () => {
    expect(isValidUrl('/relative/path')).toBe(false)
    expect(isValidUrl('relative/path')).toBe(false)
    expect(isValidUrl('./relative')).toBe(false)
  })

  it('returns false for invalid URLs', () => {
    expect(isValidUrl('')).toBe(false)
    expect(isValidUrl('not a url')).toBe(false)
    expect(isValidUrl('://malformed')).toBe(false)
  })
})

describe('isValidISODate', () => {
  it('returns true for valid ISO 8601 dates', () => {
    expect(isValidISODate('2024-01-15T10:30:00Z')).toBe(true)
    expect(isValidISODate('2024-01-15T10:30:00.000Z')).toBe(true)
    expect(isValidISODate('2024-01-15')).toBe(true)
  })

  it('returns true for other valid date formats', () => {
    expect(isValidISODate('January 15, 2024')).toBe(true)
    expect(isValidISODate('2024/01/15')).toBe(true)
  })

  it('returns false for invalid dates', () => {
    expect(isValidISODate('not a date')).toBe(false)
    expect(isValidISODate('')).toBe(false)
    expect(isValidISODate('2024-13-45')).toBe(false) // Invalid month/day
  })
})

describe('getExpectedCanonicalUrl', () => {
  it('returns SITE_URL for index.html', () => {
    expect(getExpectedCanonicalUrl('index.html')).toBe(SITE_URL)
  })

  it('converts file path to URL path for non-index files', () => {
    expect(getExpectedCanonicalUrl('blog/index.html')).toBe(`${SITE_URL}blog/`)
    expect(getExpectedCanonicalUrl('likes/index.html')).toBe(`${SITE_URL}likes/`)
  })

  it('handles nested paths', () => {
    expect(getExpectedCanonicalUrl('blog/post-title/index.html')).toBe(`${SITE_URL}blog/post-title/`)
    expect(getExpectedCanonicalUrl('deep/nested/path/index.html')).toBe(`${SITE_URL}deep/nested/path/`)
  })

  it('preserves trailing slash in converted paths', () => {
    const result = getExpectedCanonicalUrl('blog/index.html')
    expect(result.endsWith('/')).toBe(true)
  })
})

describe('isValidOgImageUrl', () => {
  it('returns true for default OG image', () => {
    expect(isValidOgImageUrl(`${SITE_URL}og-image.png`)).toBe(true)
  })

  it('returns true for Cloudinary URLs', () => {
    expect(isValidOgImageUrl('https://res.cloudinary.com/ooloth/image/upload/v1/og.png')).toBe(true)
    expect(isValidOgImageUrl('https://res.cloudinary.com/demo/image/upload/w_1200,h_630/sample.jpg')).toBe(true)
  })

  it('returns false for other URLs', () => {
    expect(isValidOgImageUrl('https://example.com/image.png')).toBe(false)
    expect(isValidOgImageUrl('https://michaeluloth.com/different-image.png')).toBe(false)
    expect(isValidOgImageUrl('/local-image.png')).toBe(false)
  })

  it('returns false for empty or invalid inputs', () => {
    expect(isValidOgImageUrl('')).toBe(false)
    expect(isValidOgImageUrl('not-a-url')).toBe(false)
  })
})

describe('hasCorrectCloudinaryDimensions', () => {
  it('returns true when URL contains correct dimensions (w_1200,h_630)', () => {
    expect(
      hasCorrectCloudinaryDimensions('https://res.cloudinary.com/ooloth/image/upload/w_1200,h_630/v1/og.png'),
    ).toBe(true)
    expect(
      hasCorrectCloudinaryDimensions(
        'https://res.cloudinary.com/demo/image/upload/c_fill,w_1200,h_630,g_center/sample.jpg',
      ),
    ).toBe(true)
  })

  it('returns false when dimensions are missing', () => {
    expect(hasCorrectCloudinaryDimensions('https://res.cloudinary.com/ooloth/image/upload/v1/og.png')).toBe(false)
  })

  it('returns false when dimensions are incorrect', () => {
    expect(hasCorrectCloudinaryDimensions('https://res.cloudinary.com/ooloth/image/upload/w_800,h_600/v1/og.png')).toBe(
      false,
    )
    expect(
      hasCorrectCloudinaryDimensions('https://res.cloudinary.com/ooloth/image/upload/w_1200,h_800/v1/og.png'),
    ).toBe(false)
  })

  it('returns false for non-Cloudinary URLs', () => {
    expect(hasCorrectCloudinaryDimensions('https://example.com/image.png')).toBe(false)
  })
})

describe('validateOgImage', () => {
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    originalFetch = global.fetch
    vi.useFakeTimers()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('returns timeout error when external image fetch exceeds 10 seconds', async () => {
    // HTML with external og:image (not Cloudinary, not local)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="og:image" content="https://slow-server.example.com/image.png" />
        </head>
      </html>
    `

    // Mock fetch to never resolve (simulating a hang that triggers AbortController)
    global.fetch = vi.fn((url: string, options?: RequestInit) => {
      return new Promise((_, reject) => {
        // Simulate abort after timeout by listening to abort signal
        const signal = options?.signal
        if (signal) {
          signal.addEventListener('abort', () => {
            const error = new Error('The operation was aborted')
            error.name = 'AbortError'
            reject(error)
          })
        }
      })
    }) as typeof global.fetch

    const promise = validateOgImage(html, 'test-page')
    await vi.runAllTimersAsync()
    const errors = await promise

    expect(errors).toHaveLength(1)
    expect(errors[0]).toEqual({
      page: 'test-page',
      error: 'og:image fetch timed out: https://slow-server.example.com/image.png',
    })
  })
})

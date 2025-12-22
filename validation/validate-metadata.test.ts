import { describe, it, expect } from 'vitest'
import {
  isValidUrl,
  isValidISODate,
  getExpectedCanonicalUrl,
  isValidOgImageUrl,
  hasCorrectCloudinaryDimensions,
} from './validate-metadata'

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
    expect(getExpectedCanonicalUrl('index.html')).toBe('https://michaeluloth.com/')
  })

  it('converts file path to URL path for non-index files', () => {
    expect(getExpectedCanonicalUrl('blog/index.html')).toBe('https://michaeluloth.com/blog/')
    expect(getExpectedCanonicalUrl('likes/index.html')).toBe('https://michaeluloth.com/likes/')
  })

  it('handles nested paths', () => {
    expect(getExpectedCanonicalUrl('blog/post-title/index.html')).toBe(
      'https://michaeluloth.com/blog/post-title/'
    )
    expect(getExpectedCanonicalUrl('deep/nested/path/index.html')).toBe(
      'https://michaeluloth.com/deep/nested/path/'
    )
  })

  it('preserves trailing slash in converted paths', () => {
    const result = getExpectedCanonicalUrl('blog/index.html')
    expect(result.endsWith('/')).toBe(true)
  })
})

describe('isValidOgImageUrl', () => {
  it('returns true for default OG image', () => {
    expect(isValidOgImageUrl('https://michaeluloth.com/og-image.png')).toBe(true)
  })

  it('returns true for Cloudinary URLs', () => {
    expect(isValidOgImageUrl('https://res.cloudinary.com/ooloth/image/upload/v1/og.png')).toBe(true)
    expect(
      isValidOgImageUrl('https://res.cloudinary.com/demo/image/upload/w_1200,h_630/sample.jpg')
    ).toBe(true)
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
      hasCorrectCloudinaryDimensions(
        'https://res.cloudinary.com/ooloth/image/upload/w_1200,h_630/v1/og.png'
      )
    ).toBe(true)
    expect(
      hasCorrectCloudinaryDimensions(
        'https://res.cloudinary.com/demo/image/upload/c_fill,w_1200,h_630,g_center/sample.jpg'
      )
    ).toBe(true)
  })

  it('returns false when dimensions are missing', () => {
    expect(
      hasCorrectCloudinaryDimensions('https://res.cloudinary.com/ooloth/image/upload/v1/og.png')
    ).toBe(false)
  })

  it('returns false when dimensions are incorrect', () => {
    expect(
      hasCorrectCloudinaryDimensions(
        'https://res.cloudinary.com/ooloth/image/upload/w_800,h_600/v1/og.png'
      )
    ).toBe(false)
    expect(
      hasCorrectCloudinaryDimensions(
        'https://res.cloudinary.com/ooloth/image/upload/w_1200,h_800/v1/og.png'
      )
    ).toBe(false)
  })

  it('returns false for non-Cloudinary URLs', () => {
    expect(hasCorrectCloudinaryDimensions('https://example.com/image.png')).toBe(false)
  })
})

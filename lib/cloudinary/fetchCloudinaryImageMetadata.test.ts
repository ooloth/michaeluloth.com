import fetchCloudinaryImageMetadata, { generateResponsiveImageUrls, ERRORS } from './fetchCloudinaryImageMetadata'
import { isOk, isErr } from '@/utils/result'
import type { CloudinaryResource } from './types'
import { type CacheAdapter } from '@/lib/cache/adapter'
import { type CloudinaryClient } from './client'

// Test helper: creates a mock cache adapter
function createMockCache(cachedValue: unknown = null): CacheAdapter {
  return {
    get: vi.fn().mockResolvedValue(cachedValue),
    set: vi.fn(),
  }
}

// Test helper: creates a mock Cloudinary client
function createMockCloudinaryClient(): CloudinaryClient {
  return {
    api: {
      resource: vi.fn(),
    },
    url: vi.fn((publicId: string, options: { width: number }) => {
      return `https://res.cloudinary.com/test/image/upload/w_${options.width}/${publicId}`
    }),
  } as CloudinaryClient
}

vi.mock('./parsePublicIdFromCloudinaryUrl', () => ({
  default: vi.fn(),
}))

describe('fetchCloudinaryImageMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('success cases', () => {
    it('returns Ok with image metadata from Cloudinary API', async () => {
      const parsePublicIdFromCloudinaryUrl = (await import('./parsePublicIdFromCloudinaryUrl')).default

      const mockCache = createMockCache()
      const mockClient = createMockCloudinaryClient()

      vi.mocked(parsePublicIdFromCloudinaryUrl).mockReturnValue('sample/image')

      const mockCloudinaryResource = {
        public_id: 'sample/image',
        width: 1200,
        height: 800,
        context: {
          custom: {
            alt: 'Test image',
            caption: 'Test caption',
          },
        },
      } as CloudinaryResource

      vi.mocked(mockClient.api.resource).mockResolvedValue(mockCloudinaryResource)

      const result = await fetchCloudinaryImageMetadata({
        url: 'https://res.cloudinary.com/test/image.jpg',
        cache: mockCache,
        cloudinaryClient: mockClient,
      })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toMatchObject({
          alt: 'Test image',
          caption: 'Test caption',
          width: 1200,
          height: 800,
          sizes: '(min-width: 768px) 768px, 100vw',
        })
        expect(result.value.src).toContain('w_1440')
        expect(result.value.srcSet).toContain('350w')
        expect(result.value.srcSet).toContain('2160w')
      }

      expect(mockClient.api.resource).toHaveBeenCalledWith('sample/image', {
        context: true,
        type: 'upload',
      })

      expect(mockCache.set).toHaveBeenCalledWith('sample/image', expect.any(Object), 'cloudinary')
    })

    it('returns Ok with cached metadata when available', async () => {
      const parsePublicIdFromCloudinaryUrl = (await import('./parsePublicIdFromCloudinaryUrl')).default

      vi.mocked(parsePublicIdFromCloudinaryUrl).mockReturnValue('sample/image')

      const cachedMetadata = {
        alt: 'Cached image',
        caption: 'Cached caption',
        width: 1000,
        height: 600,
        sizes: '(min-width: 768px) 768px, 100vw',
        src: 'https://cached.com/image.jpg',
        srcSet: 'https://cached.com/image-350.jpg 350w',
      }

      const mockCache = createMockCache(cachedMetadata)
      const mockClient = createMockCloudinaryClient()

      const result = await fetchCloudinaryImageMetadata({
        url: 'https://res.cloudinary.com/test/image.jpg',
        cache: mockCache,
        cloudinaryClient: mockClient,
      })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toEqual(cachedMetadata)
      }
    })

    it('handles images with missing alt text', async () => {
      const parsePublicIdFromCloudinaryUrl = (await import('./parsePublicIdFromCloudinaryUrl')).default

      const mockCache = createMockCache()
      const mockClient = createMockCloudinaryClient()

      vi.mocked(parsePublicIdFromCloudinaryUrl).mockReturnValue('sample/image')

      const mockCloudinaryResource = {
        public_id: 'sample/image',
        width: 1200,
        height: 800,
        context: {
          custom: {
            caption: 'Test caption',
          },
        },
      } as CloudinaryResource

      vi.mocked(mockClient.api.resource).mockResolvedValue(mockCloudinaryResource)

      const result = await fetchCloudinaryImageMetadata({
        url: 'https://res.cloudinary.com/test/image.jpg',
        cache: mockCache,
        cloudinaryClient: mockClient,
      })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value.alt).toBe('') // Empty string when alt is missing
        expect(result.value.caption).toBe('Test caption')
      }
    })

    it('handles images with missing caption', async () => {
      const parsePublicIdFromCloudinaryUrl = (await import('./parsePublicIdFromCloudinaryUrl')).default

      const mockCache = createMockCache()
      const mockClient = createMockCloudinaryClient()

      vi.mocked(parsePublicIdFromCloudinaryUrl).mockReturnValue('sample/image')

      const mockCloudinaryResource = {
        public_id: 'sample/image',
        width: 1200,
        height: 800,
        context: {
          custom: {
            alt: 'Test image',
          },
        },
      } as CloudinaryResource

      vi.mocked(mockClient.api.resource).mockResolvedValue(mockCloudinaryResource)

      const result = await fetchCloudinaryImageMetadata({
        url: 'https://res.cloudinary.com/test/image.jpg',
        cache: mockCache,
        cloudinaryClient: mockClient,
      })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value.alt).toBe('Test image')
        expect(result.value.caption).toBe('') // Empty string when caption is missing
      }
    })

    it('uses type "fetch" for URLs starting with http', async () => {
      const parsePublicIdFromCloudinaryUrl = (await import('./parsePublicIdFromCloudinaryUrl')).default

      const mockCache = createMockCache()
      const mockClient = createMockCloudinaryClient()

      vi.mocked(parsePublicIdFromCloudinaryUrl).mockReturnValue('http://example.com/image.jpg')

      const mockCloudinaryResource = {
        public_id: 'http://example.com/image.jpg',
        width: 1200,
        height: 800,
        context: {
          custom: {
            alt: 'Test',
          },
        },
      } as CloudinaryResource

      vi.mocked(mockClient.api.resource).mockResolvedValue(mockCloudinaryResource)

      const result = await fetchCloudinaryImageMetadata({
        url: 'https://cloudinary.com/fetch/image.jpg',
        cache: mockCache,
        cloudinaryClient: mockClient,
      })

      expect(isOk(result)).toBe(true)
      expect(mockClient.api.resource).toHaveBeenCalledWith('http://example.com/image.jpg', {
        context: true,
        type: 'fetch',
      })
    })
  })

  describe('error cases', () => {
    it('returns Err when URL cannot be parsed', async () => {
      const parsePublicIdFromCloudinaryUrl = (await import('./parsePublicIdFromCloudinaryUrl')).default

      const mockCache = createMockCache()
      const mockClient = createMockCloudinaryClient()

      vi.mocked(parsePublicIdFromCloudinaryUrl).mockReturnValue(null)

      const result = await fetchCloudinaryImageMetadata({
        url: 'https://invalid-url.com',
        cache: mockCache,
        cloudinaryClient: mockClient,
      })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toContain(ERRORS.PARSE_PUBLIC_ID_FAILED)
      }
    })

    it('returns Err when Cloudinary API call fails', async () => {
      const parsePublicIdFromCloudinaryUrl = (await import('./parsePublicIdFromCloudinaryUrl')).default

      const mockCache = createMockCache()
      const mockClient = createMockCloudinaryClient()

      vi.mocked(parsePublicIdFromCloudinaryUrl).mockReturnValue('sample/image')

      const apiError = new Error('Cloudinary API error')
      vi.mocked(mockClient.api.resource).mockRejectedValue(apiError)

      const result = await fetchCloudinaryImageMetadata({
        url: 'https://res.cloudinary.com/test/image.jpg',
        cache: mockCache,
        cloudinaryClient: mockClient,
      })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toContain('Error fetching Cloudinary image')
      }
    })

    it('returns Err when Cloudinary response has invalid structure', async () => {
      const parsePublicIdFromCloudinaryUrl = (await import('./parsePublicIdFromCloudinaryUrl')).default

      const mockCache = createMockCache()
      const mockClient = createMockCloudinaryClient()

      vi.mocked(parsePublicIdFromCloudinaryUrl).mockReturnValue('sample/image')

      // Missing required fields (width, height) - should fail Zod validation
      const invalidResponse = {
        public_id: 'sample/image',
        context: {
          custom: {
            alt: 'Test',
          },
        },
      }

      vi.mocked(mockClient.api.resource).mockResolvedValue(invalidResponse)

      const result = await fetchCloudinaryImageMetadata({
        url: 'https://res.cloudinary.com/test/image.jpg',
        cache: mockCache,
        cloudinaryClient: mockClient,
      })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toContain('Invalid Cloudinary API response')
      }
    })

    it('returns Err when public_id is not a string', async () => {
      const parsePublicIdFromCloudinaryUrl = (await import('./parsePublicIdFromCloudinaryUrl')).default

      const mockCache = createMockCache()
      const mockClient = createMockCloudinaryClient()

      vi.mocked(parsePublicIdFromCloudinaryUrl).mockReturnValue('sample/image')

      const invalidResponse = {
        public_id: 123, // Should be string
        width: 1200,
        height: 800,
      }

      vi.mocked(mockClient.api.resource).mockResolvedValue(invalidResponse)

      const result = await fetchCloudinaryImageMetadata({
        url: 'https://res.cloudinary.com/test/image.jpg',
        cache: mockCache,
        cloudinaryClient: mockClient,
      })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toContain('Invalid Cloudinary API response')
      }
    })

    it('returns Err when cache read fails', async () => {
      const parsePublicIdFromCloudinaryUrl = (await import('./parsePublicIdFromCloudinaryUrl')).default

      vi.mocked(parsePublicIdFromCloudinaryUrl).mockReturnValue('sample/image')

      const cacheError = new Error('Cache read error')
      const mockCache: CacheAdapter = {
        get: vi.fn().mockRejectedValue(cacheError),
        set: vi.fn(),
      }
      const mockClient = createMockCloudinaryClient()

      const result = await fetchCloudinaryImageMetadata({
        url: 'https://res.cloudinary.com/test/image.jpg',
        cache: mockCache,
        cloudinaryClient: mockClient,
      })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBe(cacheError)
      }
    })

    it('wraps non-Error exceptions as Error', async () => {
      const parsePublicIdFromCloudinaryUrl = (await import('./parsePublicIdFromCloudinaryUrl')).default

      const mockCache = createMockCache()
      const mockClient = createMockCloudinaryClient()

      vi.mocked(parsePublicIdFromCloudinaryUrl).mockReturnValue('sample/image')
      vi.mocked(mockClient.api.resource).mockRejectedValue('string error')

      const result = await fetchCloudinaryImageMetadata({
        url: 'https://res.cloudinary.com/test/image.jpg',
        cache: mockCache,
        cloudinaryClient: mockClient,
      })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(Error)
        expect(result.error.message).toContain('string error')
      }
    })
  })
})

describe('generateResponsiveImageUrls', () => {
  it('generates src URL with width 1440', () => {
    const mockClient = createMockCloudinaryClient()
    const result = generateResponsiveImageUrls('sample/image', mockClient)

    expect(result.src).toContain('w_1440')
    expect(result.src).toBe('https://res.cloudinary.com/test/image/upload/w_1440/sample/image')
  })

  it('generates srcSet with all required widths', () => {
    const mockClient = createMockCloudinaryClient()
    const result = generateResponsiveImageUrls('sample/image', mockClient)

    const expectedWidths = [350, 700, 850, 1020, 1200, 1440, 1680, 1920, 2160]

    expectedWidths.forEach(width => {
      expect(result.srcSet).toContain(`w_${width}`)
      expect(result.srcSet).toContain(`${width}w`)
    })
  })

  it('returns correct sizes string', () => {
    const mockClient = createMockCloudinaryClient()
    const result = generateResponsiveImageUrls('sample/image', mockClient)

    expect(result.sizes).toBe('(min-width: 768px) 768px, 100vw')
  })

  it('formats srcSet as comma-separated list', () => {
    const mockClient = createMockCloudinaryClient()
    const result = generateResponsiveImageUrls('sample/image', mockClient)

    const parts = result.srcSet.split(', ')
    expect(parts).toHaveLength(9) // 9 different widths
    parts.forEach(part => {
      expect(part).toMatch(/^https:\/\/.*\/w_\d+\/.*\s\d+w$/)
    })
  })
})

import fetchCloudinaryImageMetadata, {
  generateResponsiveImageUrls,
  ERRORS,
  type CloudinaryResource,
} from './fetchCloudinaryImageMetadata'
import { isOk, isErr } from '@/utils/errors/result'
import { type CacheAdapter } from '@/io/cache/adapter'
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
    url: vi.fn((publicId: string, options: { width: number; effect?: unknown }) => {
      const effectParam = options.effect ? `e_${options.effect}` : ''
      const parts = [effectParam, `w_${options.width}`].filter(Boolean).join(',')
      return `https://res.cloudinary.com/test/image/upload/${parts}/${publicId}`
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

      const mockCloudinaryResource: CloudinaryResource = {
        public_id: 'sample/image',
        width: 1200,
        height: 800,
        context: {
          custom: {
            alt: 'Test image',
            caption: 'Test caption',
          },
        },
      }

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

    it('requires alt text for all images', async () => {
      const parsePublicIdFromCloudinaryUrl = (await import('./parsePublicIdFromCloudinaryUrl')).default

      const mockCache = createMockCache()
      const mockClient = createMockCloudinaryClient()

      vi.mocked(parsePublicIdFromCloudinaryUrl).mockReturnValue('sample/image')

      const mockCloudinaryResource: CloudinaryResource = {
        public_id: 'sample/image',
        width: 1200,
        height: 800,
        context: {
          custom: {
            caption: 'Test caption',
          },
        },
      }

      vi.mocked(mockClient.api.resource).mockResolvedValue(mockCloudinaryResource)

      const result = await fetchCloudinaryImageMetadata({
        url: 'https://res.cloudinary.com/test/image.jpg',
        cache: mockCache,
        cloudinaryClient: mockClient,
      })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toContain('missing alt text')
        expect(result.error.message).toContain('sample/image')
      }
    })

    it('handles images with missing caption', async () => {
      const parsePublicIdFromCloudinaryUrl = (await import('./parsePublicIdFromCloudinaryUrl')).default

      const mockCache = createMockCache()
      const mockClient = createMockCloudinaryClient()

      vi.mocked(parsePublicIdFromCloudinaryUrl).mockReturnValue('sample/image')

      const mockCloudinaryResource: CloudinaryResource = {
        public_id: 'sample/image',
        width: 1200,
        height: 800,
        context: {
          custom: {
            alt: 'Test image',
          },
        },
      }

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

    it('passes effect parameter to responsive image URL generation', async () => {
      const parsePublicIdFromCloudinaryUrl = (await import('./parsePublicIdFromCloudinaryUrl')).default

      const mockCache = createMockCache()
      const mockClient = createMockCloudinaryClient()

      vi.mocked(parsePublicIdFromCloudinaryUrl).mockReturnValue('sample/image')

      const mockCloudinaryResource: CloudinaryResource = {
        public_id: 'sample/image',
        width: 1200,
        height: 800,
        context: {
          custom: {
            alt: 'Test image',
            caption: '',
          },
        },
      }

      vi.mocked(mockClient.api.resource).mockResolvedValue(mockCloudinaryResource)

      const result = await fetchCloudinaryImageMetadata({
        url: 'https://res.cloudinary.com/test/image.jpg',
        cache: mockCache,
        cloudinaryClient: mockClient,
        effect: 'grayscale',
      })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value.src).toContain('e_grayscale')
        expect(result.value.srcSet).toContain('e_grayscale')
      }
    })

    it('uses type "fetch" for URLs starting with http', async () => {
      const parsePublicIdFromCloudinaryUrl = (await import('./parsePublicIdFromCloudinaryUrl')).default

      const mockCache = createMockCache()
      const mockClient = createMockCloudinaryClient()

      vi.mocked(parsePublicIdFromCloudinaryUrl).mockReturnValue('http://example.com/image.jpg')

      const mockCloudinaryResource: CloudinaryResource = {
        public_id: 'http://example.com/image.jpg',
        width: 1200,
        height: 800,
        context: {
          custom: {
            alt: 'Test',
          },
        },
      }

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

      vi.mocked(parsePublicIdFromCloudinaryUrl).mockImplementation(() => {
        throw new Error('URL must be a Cloudinary URL')
      })

      const result = await fetchCloudinaryImageMetadata({
        url: 'https://invalid-url.com',
        cache: mockCache,
        cloudinaryClient: mockClient,
      })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toContain('URL must be a Cloudinary URL')
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
        expect(result.error.message).toContain(ERRORS.FETCH_FAILED)
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
        expect(result.error.message).toContain(ERRORS.INVALID_API_RESPONSE)
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
        expect(result.error.message).toContain(ERRORS.INVALID_API_RESPONSE)
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

  describe('retry logic', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('retries on timeout error and succeeds', async () => {
      const parsePublicIdFromCloudinaryUrl = (await import('./parsePublicIdFromCloudinaryUrl')).default

      const mockCache = createMockCache()
      const mockClient = createMockCloudinaryClient()

      vi.mocked(parsePublicIdFromCloudinaryUrl).mockReturnValue('sample/image')

      const timeoutError = new Error('fetch failed')
      ;(timeoutError as Error & { cause: { code: string } }).cause = { code: 'ETIMEDOUT' }

      const validResponse: CloudinaryResource = {
        public_id: 'sample/image',
        width: 1200,
        height: 800,
        context: {
          custom: {
            alt: 'Test Image',
            caption: 'A test image',
          },
        },
      }

      // First call fails with timeout, second succeeds
      vi.mocked(mockClient.api.resource).mockRejectedValueOnce(timeoutError).mockResolvedValueOnce(validResponse)

      const promise = fetchCloudinaryImageMetadata({
        url: 'https://res.cloudinary.com/test/image.jpg',
        cache: mockCache,
        cloudinaryClient: mockClient,
      })
      await vi.runAllTimersAsync()
      const result = await promise

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value.alt).toBe('Test Image')
      }
      expect(mockClient.api.resource).toHaveBeenCalledTimes(2)
    })

    it('does not retry on validation errors', async () => {
      const parsePublicIdFromCloudinaryUrl = (await import('./parsePublicIdFromCloudinaryUrl')).default

      const mockCache = createMockCache()
      const mockClient = createMockCloudinaryClient()

      vi.mocked(parsePublicIdFromCloudinaryUrl).mockReturnValue('sample/image')

      const invalidResponse = {
        public_id: 'sample/image',
        width: 'invalid', // Invalid - should be number
        height: 800,
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
      // Should only call once - validation errors are not retried
      expect(mockClient.api.resource).toHaveBeenCalledTimes(1)
    })

    it('fails after max retry attempts', async () => {
      const parsePublicIdFromCloudinaryUrl = (await import('./parsePublicIdFromCloudinaryUrl')).default

      const mockCache = createMockCache()
      const mockClient = createMockCloudinaryClient()

      vi.mocked(parsePublicIdFromCloudinaryUrl).mockReturnValue('sample/image')

      const timeoutError = new Error('network timeout')
      ;(timeoutError as Error & { cause: { code: string } }).cause = { code: 'ETIMEDOUT' }

      vi.mocked(mockClient.api.resource).mockRejectedValue(timeoutError)

      const promise = fetchCloudinaryImageMetadata({
        url: 'https://res.cloudinary.com/test/image.jpg',
        cache: mockCache,
        cloudinaryClient: mockClient,
      })
      await vi.runAllTimersAsync()
      const result = await promise

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toContain(ERRORS.FETCH_FAILED)
      }
      // Should retry 3 times total
      expect(mockClient.api.resource).toHaveBeenCalledTimes(3)
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

  describe('with effect parameter', () => {
    it('includes effect in src URL when effect is provided', () => {
      const mockClient = createMockCloudinaryClient()
      const result = generateResponsiveImageUrls('sample/image', mockClient, 'grayscale')

      expect(result.src).toContain('e_grayscale')
      expect(result.src).toContain('w_1440')
      expect(result.src).toBe('https://res.cloudinary.com/test/image/upload/e_grayscale,w_1440/sample/image')
    })

    it('includes effect in all srcSet URLs when effect is provided', () => {
      const mockClient = createMockCloudinaryClient()
      const result = generateResponsiveImageUrls('sample/image', mockClient, 'grayscale')

      const parts = result.srcSet.split(', ')
      expect(parts).toHaveLength(9)

      parts.forEach(part => {
        expect(part).toContain('e_grayscale')
        expect(part).toMatch(/^https:\/\/.*\/e_grayscale,w_\d+\/.*\s\d+w$/)
      })
    })

    it('does not include effect when undefined', () => {
      const mockClient = createMockCloudinaryClient()
      const result = generateResponsiveImageUrls('sample/image', mockClient, undefined)

      expect(result.src).not.toContain('e_')
      expect(result.src).toBe('https://res.cloudinary.com/test/image/upload/w_1440/sample/image')

      const parts = result.srcSet.split(', ')
      parts.forEach(part => {
        expect(part).not.toContain('e_')
      })
    })
  })
})

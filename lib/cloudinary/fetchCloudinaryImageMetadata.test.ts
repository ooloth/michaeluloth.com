import fetchCloudinaryImageMetadata from './fetchCloudinaryImageMetadata'
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
    url: vi.fn((publicId: string, options: any) => {
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
      } as any

      vi.mocked(mockClient.api.resource).mockResolvedValue(mockCloudinaryResource)

      const result = await fetchCloudinaryImageMetadata({ url: 'https://res.cloudinary.com/test/image.jpg', cache: mockCache, cloudinaryClient: mockClient })

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

      const result = await fetchCloudinaryImageMetadata({ url: 'https://res.cloudinary.com/test/image.jpg', cache: mockCache, cloudinaryClient: mockClient })

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

      const mockCloudinaryResource: CloudinaryResource = {
        public_id: 'sample/image',
        width: 1200,
        height: 800,
        context: {
          custom: {
            caption: 'Test caption',
          },
        },
      } as any

      vi.mocked(mockClient.api.resource).mockResolvedValue(mockCloudinaryResource)

      const result = await fetchCloudinaryImageMetadata({ url: 'https://res.cloudinary.com/test/image.jpg', cache: mockCache, cloudinaryClient: mockClient })

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

      const mockCloudinaryResource: CloudinaryResource = {
        public_id: 'sample/image',
        width: 1200,
        height: 800,
        context: {
          custom: {
            alt: 'Test image',
          },
        },
      } as any

      vi.mocked(mockClient.api.resource).mockResolvedValue(mockCloudinaryResource)

      const result = await fetchCloudinaryImageMetadata({ url: 'https://res.cloudinary.com/test/image.jpg', cache: mockCache, cloudinaryClient: mockClient })

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

      const mockCloudinaryResource: CloudinaryResource = {
        public_id: 'http://example.com/image.jpg',
        width: 1200,
        height: 800,
        context: {
          custom: {
            alt: 'Test',
          },
        },
      } as any

      vi.mocked(mockClient.api.resource).mockResolvedValue(mockCloudinaryResource)

      const result = await fetchCloudinaryImageMetadata({ url: 'https://cloudinary.com/fetch/image.jpg', cache: mockCache, cloudinaryClient: mockClient })

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

      const result = await fetchCloudinaryImageMetadata({ url: 'https://invalid-url.com', cache: mockCache, cloudinaryClient: mockClient })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toContain('Could not parse Cloudinary public ID')
      }
    })

    it('returns Err when Cloudinary API call fails', async () => {
      const parsePublicIdFromCloudinaryUrl = (await import('./parsePublicIdFromCloudinaryUrl')).default

      const mockCache = createMockCache()
      const mockClient = createMockCloudinaryClient()

      vi.mocked(parsePublicIdFromCloudinaryUrl).mockReturnValue('sample/image')

      const apiError = new Error('Cloudinary API error')
      vi.mocked(mockClient.api.resource).mockRejectedValue(apiError)

      const result = await fetchCloudinaryImageMetadata({ url: 'https://res.cloudinary.com/test/image.jpg', cache: mockCache, cloudinaryClient: mockClient })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toContain('Error fetching Cloudinary image')
      }
    })

    it('returns Err when image is missing width', async () => {
      const parsePublicIdFromCloudinaryUrl = (await import('./parsePublicIdFromCloudinaryUrl')).default

      const mockCache = createMockCache()
      const mockClient = createMockCloudinaryClient()

      vi.mocked(parsePublicIdFromCloudinaryUrl).mockReturnValue('sample/image')

      const mockCloudinaryResource: CloudinaryResource = {
        public_id: 'sample/image',
        height: 800,
        context: {
          custom: {
            alt: 'Test',
          },
        },
      } as any

      vi.mocked(mockClient.api.resource).mockResolvedValue(mockCloudinaryResource)

      const result = await fetchCloudinaryImageMetadata({ url: 'https://res.cloudinary.com/test/image.jpg', cache: mockCache, cloudinaryClient: mockClient })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toContain('missing width metadata')
      }
    })

    it('returns Err when image is missing height', async () => {
      const parsePublicIdFromCloudinaryUrl = (await import('./parsePublicIdFromCloudinaryUrl')).default

      const mockCache = createMockCache()
      const mockClient = createMockCloudinaryClient()

      vi.mocked(parsePublicIdFromCloudinaryUrl).mockReturnValue('sample/image')

      const mockCloudinaryResource: CloudinaryResource = {
        public_id: 'sample/image',
        width: 1200,
        context: {
          custom: {
            alt: 'Test',
          },
        },
      } as any

      vi.mocked(mockClient.api.resource).mockResolvedValue(mockCloudinaryResource)

      const result = await fetchCloudinaryImageMetadata({ url: 'https://res.cloudinary.com/test/image.jpg', cache: mockCache, cloudinaryClient: mockClient })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toContain('missing height metadata')
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

      const result = await fetchCloudinaryImageMetadata({ url: 'https://res.cloudinary.com/test/image.jpg', cache: mockCache, cloudinaryClient: mockClient })

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

      const result = await fetchCloudinaryImageMetadata({ url: 'https://res.cloudinary.com/test/image.jpg', cache: mockCache, cloudinaryClient: mockClient })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(Error)
        expect(result.error.message).toContain('string error')
      }
    })
  })
})

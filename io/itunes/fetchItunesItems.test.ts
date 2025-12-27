import fetchItunesItems from './fetchItunesItems'
import { isOk, isErr } from '@/utils/errors/result'
import { type CacheAdapter } from '@/io/cache/adapter'

// Test helper: creates a mock cache adapter
function createMockCache(cachedValue: unknown = null): CacheAdapter {
  return {
    get: vi.fn().mockResolvedValue(cachedValue),
    set: vi.fn().mockResolvedValue(undefined),
  }
}

// Mock dependencies
vi.mock('@/io/cloudinary/transformCloudinaryImage', () => ({
  default: vi.fn((url: string) => url), // Return URL unchanged for simplicity
}))

describe('fetchItunesItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('success cases', () => {
    it('returns Ok with valid items from API', async () => {
      const mockResponse = {
        results: [
          {
            collectionId: 123,
            collectionViewUrl: 'https://music.apple.com/album/123',
            artistName: 'Test Artist',
            artworkUrl100: 'https://example.com/art/100x100bb.jpg',
          },
        ],
      }

      global.fetch = vi.fn(async () => ({
        json: async () => mockResponse,
      })) as unknown as typeof global.fetch

      const inputItems = [{ id: 123, name: 'Test Album', date: '2024-01-15' }]

      const result = await fetchItunesItems(inputItems, 'albums')

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toHaveLength(1)
        expect(result.value[0]).toMatchObject({
          id: '123',
          title: 'Test Album',
          artist: 'Test Artist',
          date: '2024-01-15',
          link: 'https://music.apple.com/album/123',
        })
      }
    })

    it('returns Ok with multiple items sorted by date descending', async () => {
      const mockResponse = {
        results: [
          {
            collectionId: 1,
            collectionViewUrl: 'https://music.apple.com/album/1',
            artistName: 'Artist 1',
            artworkUrl100: 'https://example.com/art/100x100bb.jpg',
          },
          {
            collectionId: 2,
            collectionViewUrl: 'https://music.apple.com/album/2',
            artistName: 'Artist 2',
            artworkUrl100: 'https://example.com/art/100x100bb.jpg',
          },
          {
            collectionId: 3,
            collectionViewUrl: 'https://music.apple.com/album/3',
            artistName: 'Artist 3',
            artworkUrl100: 'https://example.com/art/100x100bb.jpg',
          },
        ],
      }

      global.fetch = vi.fn(async () => ({
        json: async () => mockResponse,
      })) as unknown as typeof global.fetch

      const inputItems = [
        { id: 1, name: 'Album 1', date: '2024-01-15' },
        { id: 2, name: 'Album 2', date: '2024-03-20' }, // Most recent
        { id: 3, name: 'Album 3', date: '2024-02-10' },
      ]

      const result = await fetchItunesItems(inputItems, 'albums')

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toHaveLength(3)
        expect(result.value[0].date).toBe('2024-03-20') // Most recent first
        expect(result.value[1].date).toBe('2024-02-10')
        expect(result.value[2].date).toBe('2024-01-15')
      }
    })

    it('handles books with trackId and trackViewUrl', async () => {
      const mockResponse = {
        results: [
          {
            trackId: 456,
            trackViewUrl: 'https://books.apple.com/book/456',
            artistName: 'Author Name',
            artworkUrl100: 'https://example.com/art/100x100bb.jpg',
          },
        ],
      }

      global.fetch = vi.fn(async () => ({
        json: async () => mockResponse,
      })) as unknown as typeof global.fetch

      const inputItems = [{ id: 456, name: 'Test Book', date: '2024-01-15' }]

      const result = await fetchItunesItems(inputItems, 'books')

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value[0].id).toBe('456')
        expect(result.value[0].link).toBe('https://books.apple.com/book/456')
      }
    })

    it('filters out invalid items but returns Ok with valid ones', async () => {
      const mockResponse = {
        results: [
          {
            collectionId: 1,
            collectionViewUrl: 'https://music.apple.com/album/1',
            artistName: 'Valid Artist',
            artworkUrl100: 'https://example.com/art/100x100bb.jpg',
          },
          {
            // Missing required fields - should be filtered out
            collectionId: 2,
            artworkUrl100: 'not-a-url',
          },
          {
            collectionId: 3,
            collectionViewUrl: 'https://music.apple.com/album/3',
            artistName: 'Another Valid Artist',
            artworkUrl100: 'https://example.com/art/100x100bb.jpg',
          },
        ],
      }

      global.fetch = vi.fn(async () => ({
        json: async () => mockResponse,
      })) as unknown as typeof global.fetch

      const inputItems = [
        { id: 1, name: 'Album 1', date: '2024-01-15' },
        { id: 2, name: 'Album 2', date: '2024-02-15' },
        { id: 3, name: 'Album 3', date: '2024-03-15' },
      ]

      const result = await fetchItunesItems(inputItems, 'albums')

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        // Should only have 2 valid items (item 2 filtered out)
        expect(result.value).toHaveLength(2)
        expect(result.value[0].id).toBe('3')
        expect(result.value[1].id).toBe('1')
      }
    })

    it('skips items not in input list', async () => {
      const mockResponse = {
        results: [
          {
            collectionId: 1,
            collectionViewUrl: 'https://music.apple.com/album/1',
            artistName: 'Artist 1',
            artworkUrl100: 'https://example.com/art/100x100bb.jpg',
          },
          {
            collectionId: 999, // Not in input items
            collectionViewUrl: 'https://music.apple.com/album/999',
            artistName: 'Artist 999',
            artworkUrl100: 'https://example.com/art/100x100bb.jpg',
          },
        ],
      }

      global.fetch = vi.fn(async () => ({
        json: async () => mockResponse,
      })) as unknown as typeof global.fetch

      const inputItems = [{ id: 1, name: 'Album 1', date: '2024-01-15' }]

      const result = await fetchItunesItems(inputItems, 'albums')

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toHaveLength(1)
        expect(result.value[0].id).toBe('1')
      }
    })

    it('deduplicates items with same ID', async () => {
      const mockResponse = {
        results: [
          {
            collectionId: 1,
            collectionViewUrl: 'https://music.apple.com/album/1',
            artistName: 'Artist 1',
            artworkUrl100: 'https://example.com/art/100x100bb.jpg',
          },
          {
            collectionId: 1, // Duplicate
            collectionViewUrl: 'https://music.apple.com/album/1',
            artistName: 'Artist 1',
            artworkUrl100: 'https://example.com/art/100x100bb.jpg',
          },
        ],
      }

      global.fetch = vi.fn(async () => ({
        json: async () => mockResponse,
      })) as unknown as typeof global.fetch

      const inputItems = [{ id: 1, name: 'Album 1', date: '2024-01-15' }]

      const result = await fetchItunesItems(inputItems, 'albums')

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toHaveLength(1)
      }
    })

    it('returns Ok with empty array when no valid items', async () => {
      const mockResponse = {
        results: [],
      }

      global.fetch = vi.fn(async () => ({
        json: async () => mockResponse,
      })) as unknown as typeof global.fetch

      const inputItems = [{ id: 1, name: 'Album 1', date: '2024-01-15' }]

      const result = await fetchItunesItems(inputItems, 'albums')

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toEqual([])
      }
    })

    it('returns Ok with cached data when available', async () => {
      const cachedData = [
        {
          id: '999',
          title: 'Cached Album',
          artist: 'Cached Artist',
          date: '2024-01-01',
          imageUrl: 'https://example.com/cached.jpg',
          link: 'https://music.apple.com/album/999',
        },
      ]

      const mockCache = createMockCache(cachedData)
      const inputItems = [{ id: 999, name: 'Cached Album', date: '2024-01-01' }]

      const result = await fetchItunesItems(inputItems, 'albums', { cache: mockCache })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toEqual(cachedData)
      }

      // Should not call API when cache hit
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('skips cache when skipCache is true', async () => {
      const mockResponse = {
        results: [
          {
            collectionId: 123,
            collectionViewUrl: 'https://music.apple.com/album/123',
            artistName: 'Fresh Artist',
            artworkUrl100: 'https://example.com/art/100x100bb.jpg',
          },
        ],
      }

      global.fetch = vi.fn(async () => ({
        json: async () => mockResponse,
      })) as unknown as typeof global.fetch

      const mockCache = createMockCache([
        {
          id: '999',
          title: 'Cached Album',
          artist: 'Cached Artist',
          date: '2024-01-01',
          imageUrl: 'https://example.com/cached.jpg',
          link: 'https://music.apple.com/album/999',
        },
      ])

      const inputItems = [{ id: 123, name: 'Fresh Album', date: '2024-01-15' }]

      const result = await fetchItunesItems(inputItems, 'albums', { skipCache: true, cache: mockCache })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toHaveLength(1)
        expect(result.value[0].id).toBe('123')
      }

      // Should not call cache.get when skipCache is true
      expect(mockCache.get).not.toHaveBeenCalled()
      // Should call API and update cache even with skipCache
      expect(global.fetch).toHaveBeenCalled()
      expect(mockCache.set).toHaveBeenCalled()
    })
  })

  describe('error cases', () => {
    it('returns Err when fetch fails', async () => {
      const networkError = new Error('Network error')
      global.fetch = vi.fn(async () => {
        throw networkError
      }) as unknown as typeof global.fetch

      const inputItems = [{ id: 1, name: 'Album 1', date: '2024-01-15' }]

      const promise = fetchItunesItems(inputItems, 'albums')
      await vi.runAllTimersAsync()
      const result = await promise

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBe(networkError)
      }
    })

    it('returns Err when JSON parsing fails', async () => {
      global.fetch = vi.fn(async () => ({
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })) as unknown as typeof global.fetch

      const inputItems = [{ id: 1, name: 'Album 1', date: '2024-01-15' }]

      const result = await fetchItunesItems(inputItems, 'albums')

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toBe('Invalid JSON')
      }
    })

    it('wraps non-Error exceptions as Error', async () => {
      global.fetch = vi.fn(async () => {
        throw 'string error'
      }) as unknown as typeof global.fetch

      const inputItems = [{ id: 1, name: 'Album 1', date: '2024-01-15' }]

      const promise = fetchItunesItems(inputItems, 'albums')
      await vi.runAllTimersAsync()
      const result = await promise

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(Error)
        expect(result.error.message).toBe('string error')
      }
    })

    it('returns Err when cache read fails', async () => {
      const cacheError = new Error('Cache read error')
      const mockCache: CacheAdapter = {
        get: vi.fn().mockRejectedValue(cacheError),
        set: vi.fn().mockResolvedValue(undefined),
      }

      const inputItems = [{ id: 1, name: 'Album 1', date: '2024-01-15' }]

      const result = await fetchItunesItems(inputItems, 'albums', { cache: mockCache })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBe(cacheError)
      }
    })
  })
})

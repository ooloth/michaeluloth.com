import fetchItunesItems from './fetchItunesItems'
import { isOk, isErr } from '@/utils/result'

// Mock dependencies
vi.mock('@/lib/cloudinary/transformCloudinaryImage', () => ({
  default: vi.fn((url: string) => url), // Return URL unchanged for simplicity
}))

vi.mock('@/utils/getImagePlaceholderForEnv', () => ({
  default: vi.fn(async () => 'data:image/png;base64,placeholder'),
}))

describe('fetchItunesItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
      })) as any

      const inputItems = [{ id: 123, name: 'Test Album', date: '2024-01-15' }]

      const result = await fetchItunesItems(inputItems, 'music', 'album')

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
      })) as any

      const inputItems = [
        { id: 1, name: 'Album 1', date: '2024-01-15' },
        { id: 2, name: 'Album 2', date: '2024-03-20' }, // Most recent
        { id: 3, name: 'Album 3', date: '2024-02-10' },
      ]

      const result = await fetchItunesItems(inputItems, 'music', 'album')

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
      })) as any

      const inputItems = [{ id: 456, name: 'Test Book', date: '2024-01-15' }]

      const result = await fetchItunesItems(inputItems, 'ebook', 'ebook')

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
      })) as any

      const inputItems = [
        { id: 1, name: 'Album 1', date: '2024-01-15' },
        { id: 2, name: 'Album 2', date: '2024-02-15' },
        { id: 3, name: 'Album 3', date: '2024-03-15' },
      ]

      const result = await fetchItunesItems(inputItems, 'music', 'album')

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
      })) as any

      const inputItems = [{ id: 1, name: 'Album 1', date: '2024-01-15' }]

      const result = await fetchItunesItems(inputItems, 'music', 'album')

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
      })) as any

      const inputItems = [{ id: 1, name: 'Album 1', date: '2024-01-15' }]

      const result = await fetchItunesItems(inputItems, 'music', 'album')

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
      })) as any

      const inputItems = [{ id: 1, name: 'Album 1', date: '2024-01-15' }]

      const result = await fetchItunesItems(inputItems, 'music', 'album')

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toEqual([])
      }
    })
  })

  describe('error cases', () => {
    it('returns Err when fetch fails', async () => {
      const networkError = new Error('Network error')
      global.fetch = vi.fn(async () => {
        throw networkError
      }) as any

      const inputItems = [{ id: 1, name: 'Album 1', date: '2024-01-15' }]

      const result = await fetchItunesItems(inputItems, 'music', 'album')

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
      })) as any

      const inputItems = [{ id: 1, name: 'Album 1', date: '2024-01-15' }]

      const result = await fetchItunesItems(inputItems, 'music', 'album')

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toBe('Invalid JSON')
      }
    })

    it('wraps non-Error exceptions as Error', async () => {
      global.fetch = vi.fn(async () => {
        throw 'string error'
      }) as any

      const inputItems = [{ id: 1, name: 'Album 1', date: '2024-01-15' }]

      const result = await fetchItunesItems(inputItems, 'music', 'album')

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(Error)
        expect(result.error.message).toBe('string error')
      }
    })
  })
})

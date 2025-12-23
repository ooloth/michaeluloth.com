import fetchTmdbList from './fetchTmdbList'
import { isOk, isErr } from '@/utils/errors/result'

// Mock dependencies
vi.mock('@/io/cloudinary/transformCloudinaryImage', () => ({
  default: vi.fn((url: string) => url),
}))

vi.mock('@/io/env', () => ({
  env: {
    TMDB_READ_ACCESS_TOKEN: 'mock-token',
  },
}))

describe('fetchTmdbList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('success cases', () => {
    it('returns Ok with valid TV shows from API', async () => {
      const mockResponse = {
        total_pages: 1,
        results: [
          {
            id: 123,
            name: 'Test TV Show',
            first_air_date: '2024-01-15',
            poster_path: '/poster.jpg',
          },
        ],
      }

      global.fetch = vi.fn(async () => ({
        json: async () => mockResponse,
      })) as unknown as typeof global.fetch

      const result = await fetchTmdbList('test-list-id', 'tv')

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toHaveLength(1)
        expect(result.value[0]).toMatchObject({
          id: '123',
          title: 'Test TV Show',
          date: '2024-01-15',
          link: 'https://www.themoviedb.org/tv/123',
        })
      }
    })

    it('returns Ok with valid movies from API', async () => {
      const mockResponse = {
        total_pages: 1,
        results: [
          {
            id: 456,
            title: 'Test Movie',
            release_date: '2024-03-20',
            poster_path: '/movie-poster.jpg',
          },
        ],
      }

      global.fetch = vi.fn(async () => ({
        json: async () => mockResponse,
      })) as unknown as typeof global.fetch

      const result = await fetchTmdbList('test-list-id', 'movie')

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toHaveLength(1)
        expect(result.value[0]).toMatchObject({
          id: '456',
          title: 'Test Movie',
          date: '2024-03-20',
          link: 'https://www.themoviedb.org/movie/456',
        })
      }
    })

    it('handles pagination correctly', async () => {
      let callCount = 0
      global.fetch = vi.fn(async () => {
        callCount++
        return {
          json: async () => ({
            total_pages: 2,
            results: [
              {
                id: callCount,
                title: `Movie ${callCount}`,
                release_date: '2024-01-15',
                poster_path: '/poster.jpg',
              },
            ],
          }),
        }
      }) as unknown as typeof global.fetch

      const result = await fetchTmdbList('test-list-id', 'movie')

      expect(global.fetch).toHaveBeenCalledTimes(2)
      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toHaveLength(2)
        expect(result.value[0].title).toBe('Movie 1')
        expect(result.value[1].title).toBe('Movie 2')
      }
    })

    it('filters out invalid items but returns Ok with valid ones', async () => {
      const mockResponse = {
        total_pages: 1,
        results: [
          {
            id: 1,
            title: 'Valid Movie',
            release_date: '2024-01-15',
            poster_path: '/poster1.jpg',
          },
          {
            // Missing poster_path - should be filtered
            id: 2,
            title: 'Invalid Movie',
            release_date: '2024-02-15',
          },
          {
            id: 3,
            title: 'Another Valid Movie',
            release_date: '2024-03-15',
            poster_path: '/poster3.jpg',
          },
        ],
      }

      global.fetch = vi.fn(async () => ({
        json: async () => mockResponse,
      })) as unknown as typeof global.fetch

      const result = await fetchTmdbList('test-list-id', 'movie')

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toHaveLength(2)
        expect(result.value[0].id).toBe('1')
        expect(result.value[1].id).toBe('3')
      }
    })

    it('deduplicates items with same ID', async () => {
      const mockResponse = {
        total_pages: 1,
        results: [
          {
            id: 1,
            title: 'Movie 1',
            release_date: '2024-01-15',
            poster_path: '/poster.jpg',
          },
          {
            id: 1, // Duplicate
            title: 'Movie 1',
            release_date: '2024-01-15',
            poster_path: '/poster.jpg',
          },
        ],
      }

      global.fetch = vi.fn(async () => ({
        json: async () => mockResponse,
      })) as unknown as typeof global.fetch

      const result = await fetchTmdbList('test-list-id', 'movie')

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toHaveLength(1)
      }
    })

    it('skips items with missing title/name', async () => {
      const mockResponse = {
        total_pages: 1,
        results: [
          {
            id: 1,
            title: 'Valid Movie',
            release_date: '2024-01-15',
            poster_path: '/poster.jpg',
          },
          {
            id: 2,
            // Missing title
            release_date: '2024-02-15',
            poster_path: '/poster.jpg',
          },
        ],
      }

      global.fetch = vi.fn(async () => ({
        json: async () => mockResponse,
      })) as unknown as typeof global.fetch

      const result = await fetchTmdbList('test-list-id', 'movie')

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toHaveLength(1)
        expect(result.value[0].id).toBe('1')
      }
    })

    it('skips items with missing date', async () => {
      const mockResponse = {
        total_pages: 1,
        results: [
          {
            id: 1,
            title: 'Valid Movie',
            release_date: '2024-01-15',
            poster_path: '/poster.jpg',
          },
          {
            id: 2,
            title: 'Movie Without Date',
            // Missing release_date
            poster_path: '/poster.jpg',
          },
        ],
      }

      global.fetch = vi.fn(async () => ({
        json: async () => mockResponse,
      })) as unknown as typeof global.fetch

      const result = await fetchTmdbList('test-list-id', 'movie')

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toHaveLength(1)
        expect(result.value[0].id).toBe('1')
      }
    })

    it('returns Ok with empty array when no valid items', async () => {
      const mockResponse = {
        total_pages: 1,
        results: [],
      }

      global.fetch = vi.fn(async () => ({
        json: async () => mockResponse,
      })) as unknown as typeof global.fetch

      const result = await fetchTmdbList('test-list-id', 'movie')

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toEqual([])
      }
    })
  })

  describe('error cases', () => {
    it('returns Err when listId is empty', async () => {
      const result = await fetchTmdbList('', 'movie')

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toBe('fetchTmdbList: listId is required')
      }
    })

    it('returns Err when fetch fails', async () => {
      const networkError = new Error('Network error')
      global.fetch = vi.fn(async () => {
        throw networkError
      }) as unknown as typeof global.fetch

      const promise = fetchTmdbList('test-list-id', 'movie')
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

      const result = await fetchTmdbList('test-list-id', 'movie')

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toBe('Invalid JSON')
      }
    })

    it('wraps non-Error exceptions as Error', async () => {
      global.fetch = vi.fn(async () => {
        throw 'string error'
      }) as unknown as typeof global.fetch

      const result = await fetchTmdbList('test-list-id', 'movie')

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(Error)
        expect(result.error.message).toBe('string error')
      }
    })

    it('returns Err on error during pagination', async () => {
      let callCount = 0
      global.fetch = vi.fn(async () => {
        callCount++
        if (callCount === 2) {
          throw new Error('Pagination error')
        }
        return {
          json: async () => ({
            total_pages: 3,
            results: [
              {
                id: callCount,
                title: `Movie ${callCount}`,
                release_date: '2024-01-15',
                poster_path: '/poster.jpg',
              },
            ],
          }),
        }
      }) as unknown as typeof global.fetch

      const result = await fetchTmdbList('test-list-id', 'movie')

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toBe('Pagination error')
      }
    })
  })
})

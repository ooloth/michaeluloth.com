import getMediaItems, {
  transformNotionPagesToMediaItems,
  INVALID_MEDIA_ITEM_ERROR,
  INVALID_MEDIA_PROPERTIES_ERROR,
  type NotionMediaItem,
} from './getMediaItems'
import { createTitleProperty, createNumberProperty, createDateProperty } from './testing/property-factories'
import { isOk, isErr } from '@/utils/errors/result'
import { type CacheAdapter } from '@/io/cache/adapter'
import { type Client, collectPaginatedAPI } from './client'

// Test helper: creates a mock cache adapter
function createMockCache(cachedValue: unknown = null): CacheAdapter {
  return {
    get: vi.fn().mockResolvedValue(cachedValue),
    set: vi.fn(),
  }
}

// Test helper: creates a mock Notion client
function createMockNotionClient(): Client {
  return {
    dataSources: {
      query: vi.fn(),
    },
  } as Client
}

vi.mock('./client', () => ({
  collectPaginatedAPI: vi.fn(),
}))

vi.mock('@/io/env', () => ({
  env: {
    NOTION_DATA_SOURCE_ID_BOOKS: 'book-ds-id',
    NOTION_DATA_SOURCE_ID_ALBUMS: 'album-ds-id',
    NOTION_DATA_SOURCE_ID_PODCASTS: 'podcast-ds-id',
  },
}))

describe('transformNotionPagesToMediaItems', () => {
  it('transforms valid Notion pages to media items', () => {
    const pages = [
      {
        id: '123',
        properties: {
          Title: createTitleProperty('The Great Gatsby'),
          'Apple ID': createNumberProperty(12345),
          Date: createDateProperty('2024-01-15'),
        },
      },
    ]

    const result = transformNotionPagesToMediaItems(pages, 'books')

    expect(result).toEqual([
      {
        id: '123',
        name: 'The Great Gatsby',
        appleId: 12345,
        date: '2024-01-15',
      },
    ])
  })

  it('throws on pages without properties', () => {
    const pages = [
      { id: '123' }, // No properties
    ]

    expect(() => transformNotionPagesToMediaItems(pages, 'books')).toThrow(INVALID_MEDIA_PROPERTIES_ERROR.books)
  })

  it.each([
    {
      case: 'missing name',
      properties: {
        Title: createTitleProperty(null),
        'Apple ID': createNumberProperty(12345),
        Date: createDateProperty('2024-01-15'),
      },
    },
    {
      case: 'missing appleId',
      properties: {
        Title: createTitleProperty('Valid Book'),
        'Apple ID': createNumberProperty(null),
        Date: createDateProperty('2024-01-15'),
      },
    },
    {
      case: 'missing date',
      properties: {
        Title: createTitleProperty('Valid Book'),
        'Apple ID': createNumberProperty(12345),
        Date: createDateProperty(null),
      },
    },
    {
      case: 'invalid appleId (not a number)',
      expectedError: INVALID_MEDIA_PROPERTIES_ERROR.books,
      properties: {
        Title: createTitleProperty('Valid Book'),
        'Apple ID': { type: 'number' as const, number: 'not-a-number' as unknown as number }, // Invalid type
        Date: createDateProperty('2024-01-15'),
      },
    },
    {
      case: 'invalid date format',
      properties: {
        Title: createTitleProperty('Valid Book'),
        'Apple ID': createNumberProperty(12345),
        Date: createDateProperty('01/15/2024'),
      },
    },
    {
      case: 'negative appleId',
      properties: {
        Title: createTitleProperty('Valid Book'),
        'Apple ID': createNumberProperty(-12345),
        Date: createDateProperty('2024-01-15'),
      },
    },
  ])('throws on items with $case', ({ properties, expectedError }) => {
    const pages = [
      {
        id: '123',
        properties,
      },
    ]

    expect(() => transformNotionPagesToMediaItems(pages, 'books')).toThrow(
      expectedError || INVALID_MEDIA_ITEM_ERROR.books,
    )
  })

  it('processes multiple valid items', () => {
    const pages = [
      {
        id: '123',
        properties: {
          Title: createTitleProperty('Book 1'),
          'Apple ID': createNumberProperty(111),
          Date: createDateProperty('2024-01-01'),
        },
      },
      {
        id: '456',
        properties: {
          Title: createTitleProperty('Book 2'),
          'Apple ID': createNumberProperty(222),
          Date: createDateProperty('2024-02-02'),
        },
      },
    ]

    const result = transformNotionPagesToMediaItems(pages, 'books')

    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Book 1')
    expect(result[1].name).toBe('Book 2')
  })
})

describe('getMediaItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('success cases', () => {
    it('returns Ok with valid media items from Notion API', async () => {
      const mockCache = createMockCache()
      const mockClient = createMockNotionClient()

      vi.mocked(collectPaginatedAPI).mockResolvedValue([
        {
          id: '123',
          properties: {
            Title: createTitleProperty('Test Book'),
            'Apple ID': createNumberProperty(12345),
            Date: createDateProperty('2024-01-15'),
          },
        },
      ])

      const result = await getMediaItems({ category: 'books', cache: mockCache, notionClient: mockClient })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toHaveLength(1)
        expect(result.value[0]).toMatchObject({
          id: '123',
          name: 'Test Book',
          appleId: 12345,
          date: '2024-01-15',
        })
      }

      expect(mockCache.set).toHaveBeenCalledWith('media-books', expect.any(Array), 'notion')
    })

    it('returns Ok with cached data when available', async () => {
      const cachedData: NotionMediaItem[] = [{ id: '456', name: 'Cached Book', appleId: 99999, date: '2024-01-01' }]

      const mockCache = createMockCache(cachedData)
      const mockClient = createMockNotionClient()

      const result = await getMediaItems({ category: 'books', cache: mockCache, notionClient: mockClient })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toEqual(cachedData)
      }

      // Should not call API when cache hit
      expect(collectPaginatedAPI).not.toHaveBeenCalled()
    })

    it('skips cache when skipCache is true', async () => {
      const mockCache = createMockCache([{ id: 'old', name: 'Old', appleId: 1, date: '2020-01-01' }])
      const mockClient = createMockNotionClient()

      vi.mocked(collectPaginatedAPI).mockResolvedValue([
        {
          id: '789',
          properties: {
            Title: createTitleProperty('Fresh Book'),
            'Apple ID': createNumberProperty(77777),
            Date: createDateProperty('2024-03-15'),
          },
        },
      ])

      const result = await getMediaItems({
        category: 'books',
        skipCache: true,
        cache: mockCache,
        notionClient: mockClient,
      })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value[0].name).toBe('Fresh Book')
      }

      // Should not call cache.get when skipCache is true
      expect(mockCache.get).not.toHaveBeenCalled()
      // Should call API and update cache even with skipCache
      expect(collectPaginatedAPI).toHaveBeenCalled()
      expect(mockCache.set).toHaveBeenCalled()
    })

    it('handles different media categories', async () => {
      const mockCache = createMockCache()
      const mockClient = createMockNotionClient()

      vi.mocked(collectPaginatedAPI).mockResolvedValue([
        {
          id: 'album-1',
          properties: {
            Title: createTitleProperty('Test Album'),
            'Apple ID': createNumberProperty(11111),
            Date: createDateProperty('2024-02-20'),
          },
        },
      ])

      const result = await getMediaItems({ category: 'albums', cache: mockCache, notionClient: mockClient })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toHaveLength(1)
        expect(result.value[0].name).toBe('Test Album')
      }
    })

    it('returns Ok with empty array when no items', async () => {
      const mockCache = createMockCache()
      const mockClient = createMockNotionClient()

      vi.mocked(collectPaginatedAPI).mockResolvedValue([])

      const result = await getMediaItems({ category: 'podcasts', cache: mockCache, notionClient: mockClient })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toEqual([])
      }
    })
  })

  describe('error cases', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.restoreAllMocks()
      vi.useRealTimers()
    })

    it('returns Err when Notion API call fails', async () => {
      const mockCache = createMockCache()
      const mockClient = createMockNotionClient()
      const apiError = new Error('Notion API error')
      vi.mocked(collectPaginatedAPI).mockRejectedValue(apiError)

      const promise = getMediaItems({ category: 'books', cache: mockCache, notionClient: mockClient })
      await vi.runAllTimersAsync()
      const result = await promise

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBe(apiError)
      }
    })

    it('returns Err when validation fails', async () => {
      const mockCache = createMockCache()
      const mockClient = createMockNotionClient()

      vi.mocked(collectPaginatedAPI).mockResolvedValue([
        {
          id: '123',
          properties: {
            Title: createTitleProperty('Book'),
            'Apple ID': createNumberProperty(-999), // Invalid: negative
            Date: createDateProperty('2024-01-15'),
          },
        },
      ])

      const result = await getMediaItems({ category: 'books', cache: mockCache, notionClient: mockClient })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toBe(INVALID_MEDIA_ITEM_ERROR.books)
      }
    })

    it('returns Err when cache read fails', async () => {
      const cacheError = new Error('Cache read error')
      const mockCache: CacheAdapter = {
        get: vi.fn().mockRejectedValue(cacheError),
        set: vi.fn(),
      }
      const mockClient = createMockNotionClient()

      const result = await getMediaItems({ category: 'books', cache: mockCache, notionClient: mockClient })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBe(cacheError)
      }
    })

    it('wraps non-Error exceptions as Error', async () => {
      const mockCache = createMockCache()
      const mockClient = createMockNotionClient()

      vi.mocked(collectPaginatedAPI).mockRejectedValue('string error')

      const promise = getMediaItems({ category: 'books', cache: mockCache, notionClient: mockClient })
      await vi.runAllTimersAsync()
      const result = await promise

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(Error)
        expect(result.error.message).toBe('string error')
      }
    })
  })
})

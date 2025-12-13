import getPosts, {
  transformNotionPagesToPostListItems,
  INVALID_POST_ERROR,
  INVALID_POST_PROPERTIES_ERROR,
} from './getPosts'
import { type PostListItem } from './schemas/post'
import {
  createRichTextProperty,
  createTitleProperty,
  createDateProperty,
  createFilesProperty,
} from './testing/property-factories'
import { isOk, isErr } from '@/utils/result'
import { type CacheAdapter } from '@/lib/cache/adapter'
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

vi.mock('@/lib/env', () => ({
  env: {
    NOTION_DATA_SOURCE_ID_WRITING: 'writing-ds-id',
  },
}))

describe('transformNotionPagesToPostListItems', () => {
  it('transforms valid Notion pages to post list items', () => {
    const pages = [
      {
        id: '123',
        properties: {
          Slug: createRichTextProperty('hello-world'),
          Title: createTitleProperty('Hello World'),
          Description: createRichTextProperty('A great post'),
          'First published': createDateProperty('2024-01-15'),
          'Featured image': createFilesProperty(['https://example.com/image.jpg']),
        },
      },
    ]

    const result = transformNotionPagesToPostListItems(pages)

    expect(result).toEqual([
      {
        id: '123',
        slug: 'hello-world',
        title: 'Hello World',
        description: 'A great post',
        firstPublished: '2024-01-15',
        featuredImage: 'https://example.com/image.jpg',
      },
    ])
  })

  it('transforms valid posts with optional fields missing', () => {
    const pages = [
      {
        id: '456',
        properties: {
          Slug: createRichTextProperty('minimal-post'),
          Title: createTitleProperty('Minimal Post'),
          Description: createRichTextProperty(null),
          'First published': createDateProperty('2024-02-20'),
          'Featured image': createFilesProperty([]),
        },
      },
    ]

    const result = transformNotionPagesToPostListItems(pages)

    expect(result).toEqual([
      {
        id: '456',
        slug: 'minimal-post',
        title: 'Minimal Post',
        description: null,
        firstPublished: '2024-02-20',
        featuredImage: null,
      },
    ])
  })

  it('throws on pages without properties', () => {
    const pages = [
      { id: '123' }, // No properties
    ]

    expect(() => transformNotionPagesToPostListItems(pages)).toThrow(INVALID_POST_PROPERTIES_ERROR)
  })

  it.each([
    {
      case: 'missing slug',
      properties: {
        Slug: createRichTextProperty(null),
        Title: createTitleProperty('Valid Title'),
        Description: createRichTextProperty(null),
        'First published': createDateProperty('2024-01-15'),
        'Featured image': createFilesProperty([]),
      },
    },
    {
      case: 'empty slug',
      properties: {
        Slug: createRichTextProperty(''),
        Title: createTitleProperty('Valid Title'),
        Description: createRichTextProperty(null),
        'First published': createDateProperty('2024-01-15'),
        'Featured image': createFilesProperty([]),
      },
    },
    {
      case: 'missing title',
      properties: {
        Slug: createRichTextProperty('valid-slug'),
        Title: createTitleProperty(null),
        Description: createRichTextProperty(null),
        'First published': createDateProperty('2024-01-15'),
        'Featured image': createFilesProperty([]),
      },
    },
    {
      case: 'missing firstPublished',
      properties: {
        Slug: createRichTextProperty('valid-slug'),
        Title: createTitleProperty('Valid Title'),
        Description: createRichTextProperty(null),
        'First published': createDateProperty(null),
        'Featured image': createFilesProperty([]),
      },
    },
    {
      case: 'invalid date format',
      properties: {
        Slug: createRichTextProperty('valid-slug'),
        Title: createTitleProperty('Valid Title'),
        Description: createRichTextProperty(null),
        'First published': createDateProperty('01/15/2024'),
        'Featured image': createFilesProperty([]),
      },
    },
    {
      case: 'invalid featuredImage URL',
      expectedError: INVALID_POST_PROPERTIES_ERROR,
      properties: {
        Slug: createRichTextProperty('valid-slug'),
        Title: createTitleProperty('Valid Title'),
        Description: createRichTextProperty(null),
        'First published': createDateProperty('2024-01-15'),
        'Featured image': createFilesProperty(['not-a-url']),
      },
    },
  ])('throws on posts with $case', ({ properties, expectedError }) => {
    const pages = [
      {
        id: '123',
        properties,
      },
    ]

    expect(() => transformNotionPagesToPostListItems(pages)).toThrow(expectedError || INVALID_POST_ERROR)
  })

  it('processes multiple valid posts', () => {
    const pages = [
      {
        id: '123',
        properties: {
          Slug: createRichTextProperty('post-1'),
          Title: createTitleProperty('Post 1'),
          Description: createRichTextProperty(null),
          'First published': createDateProperty('2024-01-01'),
          'Featured image': createFilesProperty([]),
        },
      },
      {
        id: '456',
        properties: {
          Slug: createRichTextProperty('post-2'),
          Title: createTitleProperty('Post 2'),
          Description: createRichTextProperty(null),
          'First published': createDateProperty('2024-02-02'),
          'Featured image': createFilesProperty([]),
        },
      },
    ]

    const result = transformNotionPagesToPostListItems(pages)

    expect(result).toHaveLength(2)
    expect(result[0].slug).toBe('post-1')
    expect(result[1].slug).toBe('post-2')
  })

  it('throws on first invalid post in mixed list', () => {
    const pages = [
      {
        id: '123',
        properties: {
          Slug: createRichTextProperty('post-1'),
          Title: createTitleProperty('Post 1'),
          Description: createRichTextProperty(null),
          'First published': createDateProperty('2024-01-01'),
          'Featured image': createFilesProperty([]),
        },
      },
      {
        id: '456',
        properties: {
          Slug: createRichTextProperty('post-2'),
          Title: createTitleProperty(null), // Invalid - missing title
          Description: createRichTextProperty(null),
          'First published': createDateProperty('2024-02-02'),
          'Featured image': createFilesProperty([]),
        },
      },
    ]

    expect(() => transformNotionPagesToPostListItems(pages)).toThrow(INVALID_POST_ERROR)
  })
})

describe('getPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('success cases', () => {
    it('returns Ok with valid posts from Notion API', async () => {
      const mockCache = createMockCache()
      const mockClient = createMockNotionClient()

      vi.mocked(collectPaginatedAPI).mockResolvedValue([
        {
          id: '123',
          properties: {
            Slug: createRichTextProperty('test-post'),
            Title: createTitleProperty('Test Post'),
            Description: createRichTextProperty('A test'),
            'First published': createDateProperty('2024-01-15'),
            'Featured image': createFilesProperty([]),
          },
        },
      ])

      const result = await getPosts({ cache: mockCache, notionClient: mockClient })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toHaveLength(1)
        expect(result.value[0]).toMatchObject({
          id: '123',
          slug: 'test-post',
          title: 'Test Post',
          description: 'A test',
          firstPublished: '2024-01-15',
        })
      }

      expect(mockCache.set).toHaveBeenCalledWith('posts-list-ascending', expect.any(Array), 'notion')
    })

    it('returns Ok with cached data when available', async () => {
      const cachedData: PostListItem[] = [
        {
          id: '456',
          slug: 'cached-post',
          title: 'Cached Post',
          description: null,
          firstPublished: '2024-01-01',
          featuredImage: null,
        },
      ]

      const mockCache = createMockCache(cachedData)
      const mockClient = createMockNotionClient()

      const result = await getPosts({ cache: mockCache, notionClient: mockClient })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toEqual(cachedData)
      }

      // Should not call API when cache hit
      expect(collectPaginatedAPI).not.toHaveBeenCalled()
    })

    it('skips cache when skipCache is true', async () => {
      const mockClient = createMockNotionClient()

      const mockCache = createMockCache([
        { id: 'old', slug: 'old', title: 'Old', description: null, firstPublished: '2020-01-01', featuredImage: null },
      ])

      vi.mocked(collectPaginatedAPI).mockResolvedValue([
        {
          id: '789',
          properties: {
            Slug: createRichTextProperty('fresh-post'),
            Title: createTitleProperty('Fresh Post'),
            Description: createRichTextProperty(null),
            'First published': createDateProperty('2024-03-15'),
            'Featured image': createFilesProperty([]),
          },
        },
      ])

      const result = await getPosts({ skipCache: true, cache: mockCache, notionClient: mockClient })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value[0].slug).toBe('fresh-post')
      }

      // Should not call cache.get when skipCache is true
      expect(mockCache.get).not.toHaveBeenCalled()
      // Should call API and update cache even with skipCache
      expect(collectPaginatedAPI).toHaveBeenCalled()
      expect(mockCache.set).toHaveBeenCalled()
    })

    it('respects sortDirection parameter', async () => {
      const mockClient = createMockNotionClient()

      const mockCache = createMockCache()
      vi.mocked(collectPaginatedAPI).mockResolvedValue([])

      await getPosts({ sortDirection: 'descending', cache: mockCache, notionClient: mockClient })

      expect(collectPaginatedAPI).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({
        sorts: [{ property: 'First published', direction: 'descending' }],
      }))
    })

    it('uses correct cache key for different sort directions', async () => {
      const mockClient = createMockNotionClient()

      const mockCache = createMockCache()
      vi.mocked(collectPaginatedAPI).mockResolvedValue([])

      await getPosts({ sortDirection: 'descending', cache: mockCache, notionClient: mockClient })

      expect(mockCache.get).toHaveBeenCalledWith('posts-list-descending', 'notion')
      expect(mockCache.set).toHaveBeenCalledWith('posts-list-descending', expect.any(Array), 'notion')
    })

    it('returns Ok with empty array when no posts', async () => {
      const mockClient = createMockNotionClient()

      const mockCache = createMockCache()
      vi.mocked(collectPaginatedAPI).mockResolvedValue([])

      const result = await getPosts({ cache: mockCache, notionClient: mockClient })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toEqual([])
      }
    })
  })

  describe('error cases', () => {
    it('returns Err when Notion API call fails', async () => {
      const mockClient = createMockNotionClient()

      const mockCache = createMockCache()
      const apiError = new Error('Notion API error')
      vi.mocked(collectPaginatedAPI).mockRejectedValue(apiError)

      const result = await getPosts({ cache: mockCache, notionClient: mockClient })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBe(apiError)
      }
    })

    it('returns Err when validation fails', async () => {
      const mockClient = createMockNotionClient()

      const mockCache = createMockCache()
      vi.mocked(collectPaginatedAPI).mockResolvedValue([
        {
          id: '123',
          properties: {
            Slug: createRichTextProperty(null), // Invalid: missing slug
            Title: createTitleProperty('Post'),
            Description: createRichTextProperty(null),
            'First published': createDateProperty('2024-01-15'),
            'Featured image': createFilesProperty([]),
          },
        },
      ])

      const result = await getPosts({ cache: mockCache, notionClient: mockClient })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toBe(INVALID_POST_ERROR)
      }
    })

    it('returns Err when cache read fails', async () => {
      const cacheError = new Error('Cache read error')
      const mockCache: CacheAdapter = {
        get: vi.fn().mockRejectedValue(cacheError),
        set: vi.fn(),
      }
      const mockClient = createMockNotionClient()

      const result = await getPosts({ cache: mockCache, notionClient: mockClient })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBe(cacheError)
      }
    })

    it('wraps non-Error exceptions as Error', async () => {
      const mockClient = createMockNotionClient()

      const mockCache = createMockCache()
      vi.mocked(collectPaginatedAPI).mockRejectedValue('string error')

      const result = await getPosts({ cache: mockCache, notionClient: mockClient })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(Error)
        expect(result.error.message).toBe('string error')
      }
    })
  })
})

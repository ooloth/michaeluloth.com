import getPost, {
  transformNotionPageToPost,
  INVALID_POST_DETAILS_ERROR,
  INVALID_POST_PROPERTIES_ERROR,
} from './getPost'
import {
  createRichTextProperty,
  createTitleProperty,
  createDateProperty,
  createFilesProperty,
  createUrlProperty,
} from './testing/property-factories'
import { isOk, isErr, Err } from '@/utils/errors/result'
import type { Post } from './schemas/post'
import type { GroupedBlock } from './schemas/block'
import { type CacheAdapter } from '@/io/cache/adapter'
import { type Client } from './client'

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

// Mock dependencies
vi.mock('./getBlockChildren', () => ({
  default: vi.fn(),
}))

vi.mock('./getPosts', () => ({
  default: vi.fn(),
}))

vi.mock('@/io/env', () => ({
  env: {
    NOTION_DATA_SOURCE_ID_WRITING: 'writing-ds-id',
  },
}))

describe('transformNotionPageToPost', () => {
  it('transforms valid Notion page to post', () => {
    const page = {
      id: '123',
      last_edited_time: '2024-01-20T10:30:00.000Z',
      properties: {
        Slug: createRichTextProperty('hello-world'),
        Title: createTitleProperty('Hello World'),
        Description: createRichTextProperty('A great post'),
        'First published': createDateProperty('2024-01-15'),
        'Featured image': createFilesProperty(['https://res.cloudinary.com/ooloth/image/upload/mu/test-image.jpg']),
        'Feed ID': createUrlProperty(null),
      },
    }

    const result = transformNotionPageToPost(page)

    expect(result).toEqual({
      id: '123',
      slug: 'hello-world',
      title: 'Hello World',
      description: 'A great post',
      firstPublished: '2024-01-15',
      featuredImage: 'https://res.cloudinary.com/ooloth/image/upload/mu/test-image.jpg',
      feedId: null,
      lastEditedTime: '2024-01-20T10:30:00.000Z',
      blocks: [],
      prevPost: null,
      nextPost: null,
    })
  })

  it('transforms valid post with optional fields missing', () => {
    const page = {
      id: '456',
      last_edited_time: '2024-02-25T15:45:30.000Z',
      properties: {
        Slug: createRichTextProperty('minimal-post'),
        Title: createTitleProperty('Minimal Post'),
        Description: createRichTextProperty('A minimal post description'),
        'First published': createDateProperty('2024-02-20'),
        'Featured image': createFilesProperty([]),
        'Feed ID': createUrlProperty(null),
      },
    }

    const result = transformNotionPageToPost(page)

    expect(result).toEqual({
      id: '456',
      slug: 'minimal-post',
      title: 'Minimal Post',
      description: 'A minimal post description',
      firstPublished: '2024-02-20',
      featuredImage: null,
      feedId: null,
      lastEditedTime: '2024-02-25T15:45:30.000Z',
      blocks: [],
      prevPost: null,
      nextPost: null,
    })
  })

  it('throws on pages without properties', () => {
    const page = { id: '123', last_edited_time: '2024-01-01T00:00:00.000Z' }

    expect(() => transformNotionPageToPost(page)).toThrow(INVALID_POST_PROPERTIES_ERROR)
  })

  it('throws on pages without id', () => {
    const page = {
      last_edited_time: '2024-01-01T00:00:00.000Z',
      properties: { Slug: {}, Title: {} },
    }

    expect(() => transformNotionPageToPost(page)).toThrow(INVALID_POST_DETAILS_ERROR)
  })

  it('throws on pages without last_edited_time', () => {
    const page = {
      id: '123',
      properties: { Slug: {}, Title: {} },
    }

    expect(() => transformNotionPageToPost(page)).toThrow(INVALID_POST_DETAILS_ERROR)
  })

  it.each([
    {
      case: 'missing slug',
      properties: {
        Slug: createRichTextProperty(null),
        Title: createTitleProperty('Valid Title'),
        Description: createRichTextProperty('Valid description'),
        'First published': createDateProperty('2024-01-15'),
        'Featured image': createFilesProperty([]),
        'Feed ID': createUrlProperty(null),
      },
    },
    {
      case: 'missing title',
      properties: {
        Slug: createRichTextProperty('valid-slug'),
        Title: createTitleProperty(null),
        Description: createRichTextProperty('Valid description'),
        'First published': createDateProperty('2024-01-15'),
        'Featured image': createFilesProperty([]),
        'Feed ID': createUrlProperty(null),
      },
    },
    {
      case: 'missing description',
      properties: {
        Slug: createRichTextProperty('valid-slug'),
        Title: createTitleProperty('Valid Title'),
        Description: createRichTextProperty(null),
        'First published': createDateProperty('2024-01-15'),
        'Featured image': createFilesProperty([]),
        'Feed ID': createUrlProperty(null),
      },
    },
    {
      case: 'empty description',
      properties: {
        Slug: createRichTextProperty('valid-slug'),
        Title: createTitleProperty('Valid Title'),
        Description: createRichTextProperty(''),
        'First published': createDateProperty('2024-01-15'),
        'Featured image': createFilesProperty([]),
        'Feed ID': createUrlProperty(null),
      },
    },
    {
      case: 'missing firstPublished',
      properties: {
        Slug: createRichTextProperty('valid-slug'),
        Title: createTitleProperty('Valid Title'),
        Description: createRichTextProperty('Valid description'),
        'First published': createDateProperty(null),
        'Featured image': createFilesProperty([]),
        'Feed ID': createUrlProperty(null),
      },
    },
    {
      case: 'invalid date format',
      properties: {
        Slug: createRichTextProperty('valid-slug'),
        Title: createTitleProperty('Valid Title'),
        Description: createRichTextProperty('Valid description'),
        'First published': createDateProperty('01/15/2024'),
        'Featured image': createFilesProperty([]),
        'Feed ID': createUrlProperty(null),
      },
    },
    {
      case: 'invalid featuredImage URL',
      expectedError: INVALID_POST_PROPERTIES_ERROR,
      properties: {
        Slug: createRichTextProperty('valid-slug'),
        Title: createTitleProperty('Valid Title'),
        Description: createRichTextProperty('Valid description'),
        'First published': createDateProperty('2024-01-15'),
        'Featured image': createFilesProperty(['not-a-url']),
        'Feed ID': createUrlProperty(null),
      },
    },
  ])('throws on posts with $case', ({ properties, expectedError }) => {
    const page = {
      id: '123',
      last_edited_time: '2024-01-01T00:00:00.000Z',
      properties,
    }

    expect(() => transformNotionPageToPost(page)).toThrow(expectedError || INVALID_POST_DETAILS_ERROR)
  })
})

describe('getPost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('success cases', () => {
    it('returns Ok(null) when slug is null', async () => {
      const mockCache = createMockCache()
      const mockClient = createMockNotionClient()

      const result = await getPost({ slug: null, cache: mockCache, notionClient: mockClient })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toBeNull()
      }
    })

    it('returns Ok(null) when slug is empty string', async () => {
      const mockCache = createMockCache()
      const mockClient = createMockNotionClient()

      const result = await getPost({ slug: '', cache: mockCache, notionClient: mockClient })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toBeNull()
      }
    })

    it('returns Ok with cached post when available', async () => {
      const cachedPost: Post = {
        id: '456',
        slug: 'cached-post',
        title: 'Cached Post',
        description: 'A cached post description',
        firstPublished: '2024-01-01',
        featuredImage: null,
        feedId: null,
        lastEditedTime: '2024-01-01T00:00:00.000Z',
        blocks: [],
        prevPost: null,
        nextPost: null,
      }

      const mockCache = createMockCache(cachedPost)
      const mockClient = createMockNotionClient()

      const result = await getPost({ slug: 'cached-post', cache: mockCache, notionClient: mockClient })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toEqual(cachedPost)
      }
    })

    it('returns Ok with post from Notion API', async () => {
      const mockClient = createMockNotionClient()

      const mockCache = createMockCache()
      vi.mocked(mockClient.dataSources.query).mockResolvedValue({
        results: [
          {
            id: '123',
            last_edited_time: '2024-01-20T10:30:00.000Z',
            properties: {
              Slug: createRichTextProperty('test-post'),
              Title: createTitleProperty('Test Post'),
              Description: createRichTextProperty('A test'),
              'First published': createDateProperty('2024-01-15'),
              'Featured image': createFilesProperty([]),
              'Feed ID': createUrlProperty(null),
            },
          },
        ],
      } as unknown as Awaited<ReturnType<Client['dataSources']['query']>>)

      const result = await getPost({ slug: 'test-post', cache: mockCache, notionClient: mockClient })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toMatchObject({
          id: '123',
          slug: 'test-post',
          title: 'Test Post',
          description: 'A test',
          firstPublished: '2024-01-15',
        })
      }

      expect(mockCache.set).toHaveBeenCalledWith('post-test-post-blocks-false-nav-false', expect.any(Object), 'notion')
    })

    it('returns Ok(null) when post not found', async () => {
      const mockClient = createMockNotionClient()

      const mockCache = createMockCache()
      vi.mocked(mockClient.dataSources.query).mockResolvedValue({
        results: [],
      } as unknown as Awaited<ReturnType<Client['dataSources']['query']>>)

      const result = await getPost({ slug: 'nonexistent', cache: mockCache, notionClient: mockClient })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toBeNull()
      }
    })

    it('skips cache when skipCache is true', async () => {
      const mockClient = createMockNotionClient()

      const mockCache = createMockCache({ id: 'old' })
      vi.mocked(mockClient.dataSources.query).mockResolvedValue({
        results: [
          {
            id: '789',
            last_edited_time: '2024-03-15T12:00:00.000Z',
            properties: {
              Slug: createRichTextProperty('fresh-post'),
              Title: createTitleProperty('Fresh Post'),
              Description: createRichTextProperty('Fresh post description'),
              'First published': createDateProperty('2024-03-15'),
              'Featured image': createFilesProperty([]),
              'Feed ID': createUrlProperty(null),
            },
          },
        ],
      } as unknown as Awaited<ReturnType<Client['dataSources']['query']>>)

      const result = await getPost({ slug: 'fresh-post', skipCache: true, cache: mockCache, notionClient: mockClient })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value?.slug).toBe('fresh-post')
      }

      expect(mockCache.get).not.toHaveBeenCalled()
      expect(mockCache.set).toHaveBeenCalled()
    })

    it('includes blocks when includeBlocks is true', async () => {
      const mockClient = createMockNotionClient()
      const getBlockChildren = (await import('./getBlockChildren')).default
      const { Ok } = await import('@/utils/errors/result')

      const mockCache = createMockCache()

      vi.mocked(mockClient.dataSources.query).mockResolvedValue({
        results: [
          {
            id: '123',
            last_edited_time: '2024-01-20T10:30:00.000Z',
            properties: {
              Slug: createRichTextProperty('post-with-blocks'),
              Title: createTitleProperty('Post with Blocks'),
              Description: createRichTextProperty('Post with blocks description'),
              'First published': createDateProperty('2024-01-15'),
              'Featured image': createFilesProperty([]),
              'Feed ID': createUrlProperty(null),
            },
          },
        ],
      } as unknown as Awaited<ReturnType<Client['dataSources']['query']>>)

      const mockBlocks: GroupedBlock[] = [{ type: 'paragraph', richText: [] }]
      vi.mocked(getBlockChildren).mockResolvedValue(Ok(mockBlocks))

      const result = await getPost({
        slug: 'post-with-blocks',
        includeBlocks: true,
        cache: mockCache,
        notionClient: mockClient,
      })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value?.blocks).toEqual(mockBlocks)
      }

      expect(getBlockChildren).toHaveBeenCalledWith('123')
    })

    it('includes prev/next navigation when includePrevAndNext is true', async () => {
      const mockClient = createMockNotionClient()
      const getPosts = (await import('./getPosts')).default
      const { Ok } = await import('@/utils/errors/result')

      const mockCache = createMockCache()

      vi.mocked(mockClient.dataSources.query).mockResolvedValue({
        results: [
          {
            id: '222',
            last_edited_time: '2024-02-15T10:00:00.000Z',
            properties: {
              Slug: createRichTextProperty('middle-post'),
              Title: createTitleProperty('Middle Post'),
              Description: createRichTextProperty('Middle post description'),
              'First published': createDateProperty('2024-02-15'),
              'Featured image': createFilesProperty([]),
              'Feed ID': createUrlProperty(null),
            },
          },
        ],
      } as unknown as Awaited<ReturnType<Client['dataSources']['query']>>)

      const mockPosts = [
        {
          id: '111',
          slug: 'first-post',
          title: 'First Post',
          description: 'First post description',
          firstPublished: '2024-01-01',
          featuredImage: null,
          feedId: null,
        },
        {
          id: '222',
          slug: 'middle-post',
          title: 'Middle Post',
          description: 'Middle post description',
          firstPublished: '2024-02-15',
          featuredImage: null,
          feedId: null,
        },
        {
          id: '333',
          slug: 'last-post',
          title: 'Last Post',
          description: 'Last post description',
          firstPublished: '2024-03-01',
          featuredImage: null,
          feedId: null,
        },
      ]
      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const result = await getPost({
        slug: 'middle-post',
        includePrevAndNext: true,
        cache: mockCache,
        notionClient: mockClient,
      })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value?.prevPost).toMatchObject({ slug: 'first-post' })
        expect(result.value?.nextPost).toMatchObject({ slug: 'last-post' })
      }
    })

    it('uses correct cache keys for different options', async () => {
      // Return cached post to avoid Notion API calls (we're only testing cache keys)
      const cachedPost: Post = {
        id: '123',
        slug: 'test',
        title: 'Test',
        description: 'Test description',
        firstPublished: '2024-01-01',
        featuredImage: null,
        feedId: null,
        lastEditedTime: '2024-01-01T00:00:00.000Z',
        blocks: [],
        prevPost: null,
        nextPost: null,
      }
      const mockCache = createMockCache(cachedPost)
      const mockClient = createMockNotionClient()

      await getPost({ slug: 'test', cache: mockCache, notionClient: mockClient })
      expect(mockCache.get).toHaveBeenCalledWith('post-test-blocks-false-nav-false', 'notion')

      await getPost({ slug: 'test', includeBlocks: true, cache: mockCache, notionClient: mockClient })
      expect(mockCache.get).toHaveBeenCalledWith('post-test-blocks-true-nav-false', 'notion')

      await getPost({ slug: 'test', includePrevAndNext: true, cache: mockCache, notionClient: mockClient })
      expect(mockCache.get).toHaveBeenCalledWith('post-test-blocks-false-nav-true', 'notion')
    })
  })

  describe('error cases', () => {
    it('returns Err when Notion API call fails', async () => {
      const mockClient = createMockNotionClient()

      const mockCache = createMockCache()

      const apiError = new Error('Notion API error')
      vi.mocked(mockClient.dataSources.query).mockRejectedValue(apiError)

      const result = await getPost({ slug: 'failing-post', cache: mockCache, notionClient: mockClient })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBe(apiError)
      }
    })

    it('returns Err when multiple posts found for slug', async () => {
      const mockClient = createMockNotionClient()

      const mockCache = createMockCache()

      vi.mocked(mockClient.dataSources.query).mockResolvedValue({
        results: [
          {
            id: '123',
            last_edited_time: '2024-01-20T10:30:00.000Z',
            properties: {
              Slug: createRichTextProperty('duplicate'),
              Title: createTitleProperty('Post 1'),
              Description: createRichTextProperty('Duplicate post 1 description'),
              'First published': createDateProperty('2024-01-15'),
              'Featured image': createFilesProperty([]),
              'Feed ID': createUrlProperty(null),
            },
          },
          {
            id: '456',
            last_edited_time: '2024-01-21T10:30:00.000Z',
            properties: {
              Slug: createRichTextProperty('duplicate'),
              Title: createTitleProperty('Post 2'),
              Description: createRichTextProperty('Duplicate post 2 description'),
              'First published': createDateProperty('2024-01-16'),
              'Featured image': createFilesProperty([]),
              'Feed ID': createUrlProperty(null),
            },
          },
        ],
      } as unknown as Awaited<ReturnType<Client['dataSources']['query']>>)

      const result = await getPost({ slug: 'duplicate', cache: mockCache, notionClient: mockClient })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toContain('Multiple posts found for slug')
      }
    })

    it('returns Err when validation fails', async () => {
      const mockClient = createMockNotionClient()

      const mockCache = createMockCache()

      vi.mocked(mockClient.dataSources.query).mockResolvedValue({
        results: [
          {
            id: '123',
            last_edited_time: '2024-01-20T10:30:00.000Z',
            properties: {
              Slug: createRichTextProperty(null), // Invalid: missing slug
              Title: createTitleProperty('Post'),
              Description: createRichTextProperty('Valid description'),
              'First published': createDateProperty('2024-01-15'),
              'Featured image': createFilesProperty([]),
              'Feed ID': createUrlProperty(null),
            },
          },
        ],
      } as unknown as Awaited<ReturnType<Client['dataSources']['query']>>)

      const result = await getPost({ slug: 'invalid', cache: mockCache, notionClient: mockClient })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toBe(INVALID_POST_DETAILS_ERROR)
      }
    })

    it('returns Err when cache read fails', async () => {
      const cacheError = new Error('Cache read error')
      const mockCache: CacheAdapter = {
        get: vi.fn().mockRejectedValue(cacheError),
        set: vi.fn(),
      }
      const mockClient = createMockNotionClient()

      const result = await getPost({ slug: 'test', cache: mockCache, notionClient: mockClient })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBe(cacheError)
      }
    })

    it('wraps non-Error exceptions as Error', async () => {
      const mockClient = createMockNotionClient()

      const mockCache = createMockCache()

      vi.mocked(mockClient.dataSources.query).mockRejectedValue('string error')

      const result = await getPost({ slug: 'test', cache: mockCache, notionClient: mockClient })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(Error)
        expect(result.error.message).toBe('string error')
      }
    })

    it('returns Err when getPosts fails during navigation fetch', async () => {
      const mockClient = createMockNotionClient()
      const getPosts = (await import('./getPosts')).default

      const mockCache = createMockCache()

      const mockPage = {
        id: '123',
        last_edited_time: '2024-01-20T10:30:00.000Z',
        properties: {
          Slug: { type: 'rich_text', rich_text: [{ plain_text: 'test' }] },
          Title: { type: 'title', title: [{ plain_text: 'Test Post' }] },
          Description: { type: 'rich_text', rich_text: [{ plain_text: 'Test description' }] },
          'First published': { type: 'date', date: { start: '2024-01-15' } },
          'Featured image': { type: 'files', files: [] },
          'Feed ID': { type: 'url', url: null },
        },
      }

      vi.mocked(mockClient.dataSources.query).mockResolvedValue({
        results: [mockPage],
      } as unknown as Awaited<ReturnType<Client['dataSources']['query']>>)

      const getPostsError = new Error('Failed to fetch posts')
      vi.mocked(getPosts).mockResolvedValue(Err(getPostsError))

      const result = await getPost({
        slug: 'test',
        includePrevAndNext: true,
        cache: mockCache,
        notionClient: mockClient,
      })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBe(getPostsError)
      }
    })

    it('returns Err when getBlockChildren fails during block fetch', async () => {
      const mockClient = createMockNotionClient()
      const getBlockChildren = (await import('./getBlockChildren')).default

      const mockCache = createMockCache()

      const mockPage = {
        id: '123',
        last_edited_time: '2024-01-20T10:30:00.000Z',
        properties: {
          Slug: { type: 'rich_text', rich_text: [{ plain_text: 'test' }] },
          Title: { type: 'title', title: [{ plain_text: 'Test Post' }] },
          Description: { type: 'rich_text', rich_text: [{ plain_text: 'Test description' }] },
          'First published': { type: 'date', date: { start: '2024-01-15' } },
          'Featured image': { type: 'files', files: [] },
          'Feed ID': { type: 'url', url: null },
        },
      }

      vi.mocked(mockClient.dataSources.query).mockResolvedValue({
        results: [mockPage],
      } as unknown as Awaited<ReturnType<Client['dataSources']['query']>>)

      const getBlockChildrenError = new Error('Failed to fetch blocks')
      vi.mocked(getBlockChildren).mockResolvedValue(Err(getBlockChildrenError))

      const result = await getPost({ slug: 'test', includeBlocks: true, cache: mockCache, notionClient: mockClient })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBe(getBlockChildrenError)
      }
    })
  })
})

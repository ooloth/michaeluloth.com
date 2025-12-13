import getPost, { transformNotionPageToPost, INVALID_POST_DETAILS_ERROR, INVALID_POST_PROPERTIES_ERROR } from './getPost'
import {
  createRichTextProperty,
  createTitleProperty,
  createDateProperty,
  createFilesProperty,
} from './testing/property-factories'
import { isOk, isErr } from '@/utils/result'
import type { Post } from './schemas/post'

// Mock dependencies
vi.mock('./client', () => ({
  default: {
    dataSources: {
      query: vi.fn(),
    },
  },
}))

vi.mock('@/lib/cache/filesystem', () => ({
  getCached: vi.fn(),
  setCached: vi.fn(),
}))

vi.mock('./getBlockChildren', () => ({
  default: vi.fn(),
}))

vi.mock('./getPosts', () => ({
  default: vi.fn(),
}))

vi.mock('@/lib/env', () => ({
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
        'Featured image': createFilesProperty(['https://example.com/image.jpg']),
      },
    }

    const result = transformNotionPageToPost(page)

    expect(result).toEqual({
      id: '123',
      slug: 'hello-world',
      title: 'Hello World',
      description: 'A great post',
      firstPublished: '2024-01-15',
      featuredImage: 'https://example.com/image.jpg',
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
        Description: createRichTextProperty(null),
        'First published': createDateProperty('2024-02-20'),
        'Featured image': createFilesProperty([]),
      },
    }

    const result = transformNotionPageToPost(page)

    expect(result).toEqual({
      id: '456',
      slug: 'minimal-post',
      title: 'Minimal Post',
      description: null,
      firstPublished: '2024-02-20',
      featuredImage: null,
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
      const result = await getPost({ slug: null })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toBeNull()
      }
    })

    it('returns Ok(null) when slug is empty string', async () => {
      const result = await getPost({ slug: '' })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toBeNull()
      }
    })

    it('returns Ok with cached post when available', async () => {
      const { getCached } = await import('@/lib/cache/filesystem')

      const cachedPost: Post = {
        id: '456',
        slug: 'cached-post',
        title: 'Cached Post',
        description: null,
        firstPublished: '2024-01-01',
        featuredImage: null,
        lastEditedTime: '2024-01-01T00:00:00.000Z',
        blocks: [],
        prevPost: null,
        nextPost: null,
      }
      vi.mocked(getCached).mockResolvedValue(cachedPost)

      const result = await getPost({ slug: 'cached-post' })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toEqual(cachedPost)
      }
    })

    it('returns Ok with post from Notion API', async () => {
      const notion = (await import('./client')).default
      const { getCached, setCached } = await import('@/lib/cache/filesystem')

      vi.mocked(getCached).mockResolvedValue(null)
      vi.mocked(notion.dataSources.query).mockResolvedValue({
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
            },
          },
        ],
      } as any)

      const result = await getPost({ slug: 'test-post' })

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

      expect(setCached).toHaveBeenCalledWith(
        'post-test-post-blocks-false-nav-false',
        expect.any(Object),
        'notion'
      )
    })

    it('returns Ok(null) when post not found', async () => {
      const notion = (await import('./client')).default
      const { getCached } = await import('@/lib/cache/filesystem')

      vi.mocked(getCached).mockResolvedValue(null)
      vi.mocked(notion.dataSources.query).mockResolvedValue({
        results: [],
      } as any)

      const result = await getPost({ slug: 'nonexistent' })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toBeNull()
      }
    })

    it('skips cache when skipCache is true', async () => {
      const notion = (await import('./client')).default
      const { getCached, setCached } = await import('@/lib/cache/filesystem')

      vi.mocked(getCached).mockResolvedValue({ id: 'old' } as any)
      vi.mocked(notion.dataSources.query).mockResolvedValue({
        results: [
          {
            id: '789',
            last_edited_time: '2024-03-15T12:00:00.000Z',
            properties: {
              Slug: createRichTextProperty('fresh-post'),
              Title: createTitleProperty('Fresh Post'),
              Description: createRichTextProperty(null),
              'First published': createDateProperty('2024-03-15'),
              'Featured image': createFilesProperty([]),
            },
          },
        ],
      } as any)

      const result = await getPost({ slug: 'fresh-post', skipCache: true })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value?.slug).toBe('fresh-post')
      }

      expect(getCached).not.toHaveBeenCalled()
      expect(setCached).toHaveBeenCalled()
    })

    it('includes blocks when includeBlocks is true', async () => {
      const notion = (await import('./client')).default
      const { getCached } = await import('@/lib/cache/filesystem')
      const getBlockChildren = (await import('./getBlockChildren')).default
      const { Ok } = await import('@/utils/result')

      vi.mocked(getCached).mockResolvedValue(null)
      vi.mocked(notion.dataSources.query).mockResolvedValue({
        results: [
          {
            id: '123',
            last_edited_time: '2024-01-20T10:30:00.000Z',
            properties: {
              Slug: createRichTextProperty('post-with-blocks'),
              Title: createTitleProperty('Post with Blocks'),
              Description: createRichTextProperty(null),
              'First published': createDateProperty('2024-01-15'),
              'Featured image': createFilesProperty([]),
            },
          },
        ],
      } as any)

      const mockBlocks = [{ id: 'block-1', type: 'paragraph' }]
      vi.mocked(getBlockChildren).mockResolvedValue(Ok(mockBlocks as any))

      const result = await getPost({ slug: 'post-with-blocks', includeBlocks: true })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value?.blocks).toEqual(mockBlocks)
      }

      expect(getBlockChildren).toHaveBeenCalledWith('123')
    })

    it('includes prev/next navigation when includePrevAndNext is true', async () => {
      const notion = (await import('./client')).default
      const { getCached } = await import('@/lib/cache/filesystem')
      const getPosts = (await import('./getPosts')).default
      const { Ok } = await import('@/utils/result')

      vi.mocked(getCached).mockResolvedValue(null)
      vi.mocked(notion.dataSources.query).mockResolvedValue({
        results: [
          {
            id: '222',
            last_edited_time: '2024-02-15T10:00:00.000Z',
            properties: {
              Slug: createRichTextProperty('middle-post'),
              Title: createTitleProperty('Middle Post'),
              Description: createRichTextProperty(null),
              'First published': createDateProperty('2024-02-15'),
              'Featured image': createFilesProperty([]),
            },
          },
        ],
      } as any)

      const mockPosts = [
        {
          id: '111',
          slug: 'first-post',
          title: 'First Post',
          description: null,
          firstPublished: '2024-01-01',
          featuredImage: null,
        },
        {
          id: '222',
          slug: 'middle-post',
          title: 'Middle Post',
          description: null,
          firstPublished: '2024-02-15',
          featuredImage: null,
        },
        {
          id: '333',
          slug: 'last-post',
          title: 'Last Post',
          description: null,
          firstPublished: '2024-03-01',
          featuredImage: null,
        },
      ]
      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const result = await getPost({ slug: 'middle-post', includePrevAndNext: true })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value?.prevPost).toMatchObject({ slug: 'first-post' })
        expect(result.value?.nextPost).toMatchObject({ slug: 'last-post' })
      }
    })

    it('uses correct cache keys for different options', async () => {
      const { getCached } = await import('@/lib/cache/filesystem')

      vi.mocked(getCached).mockResolvedValue(null)

      await getPost({ slug: 'test' })
      expect(getCached).toHaveBeenCalledWith('post-test-blocks-false-nav-false', 'notion')

      await getPost({ slug: 'test', includeBlocks: true })
      expect(getCached).toHaveBeenCalledWith('post-test-blocks-true-nav-false', 'notion')

      await getPost({ slug: 'test', includePrevAndNext: true })
      expect(getCached).toHaveBeenCalledWith('post-test-blocks-false-nav-true', 'notion')
    })
  })

  describe('error cases', () => {
    it('returns Err when Notion API call fails', async () => {
      const notion = (await import('./client')).default
      const { getCached } = await import('@/lib/cache/filesystem')

      vi.mocked(getCached).mockResolvedValue(null)
      const apiError = new Error('Notion API error')
      vi.mocked(notion.dataSources.query).mockRejectedValue(apiError)

      const result = await getPost({ slug: 'failing-post' })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBe(apiError)
      }
    })

    it('returns Err when multiple posts found for slug', async () => {
      const notion = (await import('./client')).default
      const { getCached } = await import('@/lib/cache/filesystem')

      vi.mocked(getCached).mockResolvedValue(null)
      vi.mocked(notion.dataSources.query).mockResolvedValue({
        results: [
          {
            id: '123',
            last_edited_time: '2024-01-20T10:30:00.000Z',
            properties: {
              Slug: createRichTextProperty('duplicate'),
              Title: createTitleProperty('Post 1'),
              Description: createRichTextProperty(null),
              'First published': createDateProperty('2024-01-15'),
              'Featured image': createFilesProperty([]),
            },
          },
          {
            id: '456',
            last_edited_time: '2024-01-21T10:30:00.000Z',
            properties: {
              Slug: createRichTextProperty('duplicate'),
              Title: createTitleProperty('Post 2'),
              Description: createRichTextProperty(null),
              'First published': createDateProperty('2024-01-16'),
              'Featured image': createFilesProperty([]),
            },
          },
        ],
      } as any)

      const result = await getPost({ slug: 'duplicate' })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toContain('Multiple posts found for slug')
      }
    })

    it('returns Err when validation fails', async () => {
      const notion = (await import('./client')).default
      const { getCached } = await import('@/lib/cache/filesystem')

      vi.mocked(getCached).mockResolvedValue(null)
      vi.mocked(notion.dataSources.query).mockResolvedValue({
        results: [
          {
            id: '123',
            last_edited_time: '2024-01-20T10:30:00.000Z',
            properties: {
              Slug: createRichTextProperty(null), // Invalid: missing slug
              Title: createTitleProperty('Post'),
              Description: createRichTextProperty(null),
              'First published': createDateProperty('2024-01-15'),
              'Featured image': createFilesProperty([]),
            },
          },
        ],
      } as any)

      const result = await getPost({ slug: 'invalid' })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toBe(INVALID_POST_DETAILS_ERROR)
      }
    })

    it('returns Err when cache read fails', async () => {
      const { getCached } = await import('@/lib/cache/filesystem')

      const cacheError = new Error('Cache read error')
      vi.mocked(getCached).mockRejectedValue(cacheError)

      const result = await getPost({ slug: 'test' })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBe(cacheError)
      }
    })

    it('wraps non-Error exceptions as Error', async () => {
      const notion = (await import('./client')).default
      const { getCached } = await import('@/lib/cache/filesystem')

      vi.mocked(getCached).mockResolvedValue(null)
      vi.mocked(notion.dataSources.query).mockRejectedValue('string error')

      const result = await getPost({ slug: 'test' })

      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(Error)
        expect(result.error.message).toBe('string error')
      }
    })
  })
})

import getPost from './getPost'
import getPosts from './getPosts'
import getBlockChildren from './getBlockChildren'
import getMediaItems from './getMediaItems'
import { isOk, isErr } from '@/utils/errors/result'

/**
 * Integration tests for Notion API functions.
 *
 * Unlike unit tests that mock everything, these tests verify the full flow:
 * - Result pattern propagates correctly through nested calls
 * - Transformations work end-to-end
 * - Error handling at boundaries between functions
 *
 * We still mock the Notion API itself to avoid hitting real endpoints,
 * but we don't mock our own Result-returning functions.
 */

// Test helpers for creating properly typed mock data
type MockNotionPage = {
  id: string
  last_edited_time?: string
  properties: Record<string, unknown>
}

type MockNotionBlock = {
  id: string
  type: string
  [key: string]: unknown
}

type MockQueryResponse = {
  results: MockNotionPage[]
}

// Mock only the Notion client, not our functions
vi.mock('./client', () => ({
  default: {
    dataSources: {
      query: vi.fn(),
    },
    blocks: {
      children: {
        list: vi.fn(),
      },
    },
  },
  collectPaginatedAPI: vi.fn(),
}))

// Mock cache to avoid filesystem I/O
vi.mock('@/lib/cache/filesystem', () => ({
  getCached: vi.fn().mockResolvedValue(null),
  setCached: vi.fn().mockResolvedValue(undefined),
}))

describe('Notion API Integration Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetAllMocks()

    // Reset mocks to default implementations
    const notion = (await import('./client')).default
    const { collectPaginatedAPI } = await import('./client')

    vi.mocked(notion.dataSources.query).mockReset()
    vi.mocked(collectPaginatedAPI).mockReset()
  })

  describe('getPost with nested Result calls', () => {
    it('successfully chains getPosts and getBlockChildren', async () => {
      const notion = (await import('./client')).default
      const { collectPaginatedAPI } = await import('./client')

      // Mock getPosts data (will be called for navigation)
      const mockPostsPages = [
        {
          id: 'post-1',
          last_edited_time: '2024-01-01T00:00:00.000Z',
          properties: {
            Slug: { type: 'rich_text', rich_text: [{ plain_text: 'first-post' }] },
            Title: { type: 'title', title: [{ plain_text: 'First Post' }] },
            Description: { type: 'rich_text', rich_text: [{ plain_text: 'First description' }] },
            'First published': { type: 'date', date: { start: '2024-01-01' } },
            'Featured image': { type: 'files', files: [] },
          },
        },
        {
          id: 'post-2',
          last_edited_time: '2024-01-15T00:00:00.000Z',
          properties: {
            Slug: { type: 'rich_text', rich_text: [{ plain_text: 'current-post' }] },
            Title: { type: 'title', title: [{ plain_text: 'Current Post' }] },
            Description: { type: 'rich_text', rich_text: [{ plain_text: 'Current description' }] },
            'First published': { type: 'date', date: { start: '2024-01-15' } },
            'Featured image': { type: 'files', files: [] },
          },
        },
        {
          id: 'post-3',
          last_edited_time: '2024-02-01T00:00:00.000Z',
          properties: {
            Slug: { type: 'rich_text', rich_text: [{ plain_text: 'next-post' }] },
            Title: { type: 'title', title: [{ plain_text: 'Next Post' }] },
            Description: { type: 'rich_text', rich_text: [{ plain_text: 'Next description' }] },
            'First published': { type: 'date', date: { start: '2024-02-01' } },
            'Featured image': { type: 'files', files: [] },
          },
        },
      ]

      // Mock getPost query (single post)
      const mockCurrentPost = mockPostsPages[1]

      // Mock getBlockChildren data
      const mockBlocks = [
        {
          id: 'block-1',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Test paragraph', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                },
              },
            ],
          },
        },
      ]

      // Mock notion.dataSources.query for getPost's direct query
      const queryResponse: MockQueryResponse = { results: [mockCurrentPost] }
      vi.mocked(notion.dataSources.query).mockResolvedValueOnce(queryResponse)

      // Mock collectPaginatedAPI for getPosts (navigation)
      vi.mocked(collectPaginatedAPI).mockResolvedValueOnce(mockPostsPages)

      // Mock collectPaginatedAPI for getBlockChildren
      vi.mocked(collectPaginatedAPI).mockResolvedValueOnce(mockBlocks)

      // Call getPost with both navigation and blocks
      const result = await getPost({
        slug: 'current-post',
        includeBlocks: true,
        includePrevAndNext: true,
        skipCache: true,
      })

      // Verify success
      expect(isOk(result)).toBe(true)
      if (!isOk(result)) return

      const post = result.value
      expect(post).not.toBeNull()
      if (!post) return

      // Verify post data
      expect(post.slug).toBe('current-post')
      expect(post.title).toBe('Current Post')

      // Verify navigation was populated from getPosts
      expect(post.prevPost).not.toBeNull()
      expect(post.prevPost?.slug).toBe('first-post')
      expect(post.nextPost).not.toBeNull()
      expect(post.nextPost?.slug).toBe('next-post')

      // Verify blocks were populated from getBlockChildren
      expect(post.blocks).toHaveLength(1)
      expect(post.blocks[0].type).toBe('paragraph')
    })

    it('propagates error from getPosts when fetching navigation', async () => {
      const notion = (await import('./client')).default
      const { collectPaginatedAPI } = await import('./client')

      // Mock successful getPost query
      const mockPost = {
        id: 'post-1',
        last_edited_time: '2024-01-15T00:00:00.000Z',
        properties: {
          Slug: { type: 'rich_text', rich_text: [{ plain_text: 'test-post' }] },
          Title: { type: 'title', title: [{ plain_text: 'Test Post' }] },
          Description: { type: 'rich_text', rich_text: [{ plain_text: 'Description' }] },
          'First published': { type: 'date', date: { start: '2024-01-15' } },
          'Featured image': { type: 'files', files: [] },
        },
      }

      // Mock successful getPost direct query
      const queryResponse: MockQueryResponse = { results: [mockPost] }
      vi.mocked(notion.dataSources.query).mockResolvedValueOnce(queryResponse)

      // Mock getPosts failure (via collectPaginatedAPI)
      vi.mocked(collectPaginatedAPI).mockRejectedValueOnce(new Error('Failed to fetch posts for navigation'))

      const result = await getPost({
        slug: 'test-post',
        includePrevAndNext: true,
        skipCache: true,
      })

      // Verify error propagated
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toContain('Failed to fetch posts for navigation')
      }
    })

    it('propagates error from getBlockChildren when fetching blocks', async () => {
      const notion = (await import('./client')).default
      const { collectPaginatedAPI } = await import('./client')

      // Mock successful getPost query
      const mockPost = {
        id: 'post-1',
        last_edited_time: '2024-01-15T00:00:00.000Z',
        properties: {
          Slug: { type: 'rich_text', rich_text: [{ plain_text: 'test-post' }] },
          Title: { type: 'title', title: [{ plain_text: 'Test Post' }] },
          Description: { type: 'rich_text', rich_text: [{ plain_text: 'Description' }] },
          'First published': { type: 'date', date: { start: '2024-01-15' } },
          'Featured image': { type: 'files', files: [] },
        },
      }

      const queryResponse: MockQueryResponse = { results: [mockPost] }
      vi.mocked(notion.dataSources.query).mockResolvedValue(queryResponse)

      vi.mocked(collectPaginatedAPI).mockRejectedValue(new Error('Failed to fetch blocks'))

      const result = await getPost({
        slug: 'test-post',
        includeBlocks: true,
        skipCache: true,
      })

      // Verify error propagated
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toContain('Failed to fetch blocks')
      }
    })
  })

  describe('Data transformation pipeline', () => {
    it('transforms Notion pages → Posts → navigation structure', async () => {
      const { collectPaginatedAPI } = await import('./client')

      // Mock pages in descending order by date (as Notion API would return them)
      const mockPages = [
        {
          id: 'post-2',
          last_edited_time: '2024-01-15T00:00:00.000Z',
          properties: {
            Slug: { type: 'rich_text', rich_text: [{ plain_text: 'post-2' }] },
            Title: { type: 'title', title: [{ plain_text: 'Post 2' }] },
            Description: { type: 'rich_text', rich_text: [{ plain_text: 'Description 2' }] },
            'First published': { type: 'date', date: { start: '2024-01-15' } },
            'Featured image': { type: 'files', files: [] },
          },
        },
        {
          id: 'post-1',
          last_edited_time: '2024-01-01T00:00:00.000Z',
          properties: {
            Slug: { type: 'rich_text', rich_text: [{ plain_text: 'post-1' }] },
            Title: { type: 'title', title: [{ plain_text: 'Post 1' }] },
            Description: { type: 'rich_text', rich_text: [{ plain_text: 'Description 1' }] },
            'First published': { type: 'date', date: { start: '2024-01-01' } },
            'Featured image': { type: 'files', files: [] },
          },
        },
      ]

      vi.mocked(collectPaginatedAPI).mockResolvedValueOnce(mockPages)

      // Default sort is ascending, but mock data is in descending order (as returned by API)
      const result = await getPosts({ sortDirection: 'descending', skipCache: true })

      expect(isOk(result)).toBe(true)
      if (!isOk(result)) return

      const posts = result.value

      // Verify transformation
      expect(posts).toHaveLength(2)
      expect(posts[0].slug).toBe('post-2') // Newer post first (descending order)
      expect(posts[0].title).toBe('Post 2')
      expect(posts[1].slug).toBe('post-1')
      expect(posts[1].title).toBe('Post 1')

      // Verify domain objects have flat structure (not nested Notion properties)
      expect(posts[0]).toHaveProperty('slug')
      expect(posts[0]).toHaveProperty('title')
      expect(posts[0]).toHaveProperty('description')
      expect(posts[0]).not.toHaveProperty('properties')
    })

    it('transforms Notion pages → MediaItems with category filter', async () => {
      const { collectPaginatedAPI } = await import('./client')

      const mockPages = [
        {
          id: 'book-1',
          properties: {
            Title: { type: 'title', title: [{ plain_text: 'Book Title' }] },
            'Apple ID': { type: 'number', number: 123456 },
            Date: { type: 'date', date: { start: '2024-01-15' } },
          },
        },
      ]

      vi.mocked(collectPaginatedAPI).mockResolvedValueOnce(mockPages)

      const result = await getMediaItems({ category: 'books', skipCache: true })

      expect(isOk(result)).toBe(true)
      if (!isOk(result)) return

      const items = result.value

      // Verify transformation
      expect(items).toHaveLength(1)
      expect(items[0].name).toBe('Book Title')
      expect(items[0].appleId).toBe(123456)
      expect(items[0].date).toBe('2024-01-15')

      // Verify flat structure
      expect(items[0]).not.toHaveProperty('properties')
    })
  })

  describe('Error handling at API boundaries', () => {
    it('validates and rejects invalid Notion page data', async () => {
      const { collectPaginatedAPI } = await import('./client')

      // Missing required fields
      const invalidPage = {
        id: 'invalid-post',
        last_edited_time: '2024-01-15T00:00:00.000Z',
        properties: {
          Slug: { type: 'rich_text', rich_text: [{ plain_text: null }] }, // Invalid: null slug
          Title: { type: 'title', title: [{ plain_text: 'Valid Title' }] },
          Description: { type: 'rich_text', rich_text: [] },
          'First published': { type: 'date', date: { start: '2024-01-15' } },
          'Featured image': { type: 'files', files: [] },
        },
      }

      // Intentionally invalid for validation test
      vi.mocked(collectPaginatedAPI).mockResolvedValueOnce([invalidPage] as MockNotionPage[])

      const result = await getPosts({ skipCache: true })

      // Should return Err due to validation failure
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toContain('Invalid post')
        expect(result.error.message).toContain('build aborted')
      }
    })

    it('validates and rejects invalid block data', async () => {
      const { collectPaginatedAPI } = await import('./client')

      // Invalid block structure
      const invalidBlocks = [
        {
          id: 'block-1',
          type: 'unsupported_type', // Not in our schema
          unsupported_type: {},
        },
      ]

      // Intentionally invalid for validation test
      vi.mocked(collectPaginatedAPI).mockResolvedValue(invalidBlocks as MockNotionBlock[])

      const result = await getBlockChildren('test-block-id')

      // Should return Err due to validation failure
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error.message).toContain('Invalid block data - build aborted')
      }
    })
  })
})

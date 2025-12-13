import { generateStaticParams } from './page'
import DynamicRoute from './page'
import getPosts from '@/lib/notion/getPosts'
import getPost from '@/lib/notion/getPost'
import { notFound } from 'next/navigation'
import { Ok, Err } from '@/utils/result'

// Mock dependencies
vi.mock('@/lib/notion/getPosts')
vi.mock('@/lib/notion/getPost')
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}))

describe('generateStaticParams', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('success cases', () => {
    it('returns array of slug params for all posts', async () => {
      const mockPosts = [
        {
          id: '1',
          slug: 'first-post',
          title: 'First Post',
          description: 'Description 1',
          firstPublished: '2024-01-01',
          featuredImage: null,
        },
        {
          id: '2',
          slug: 'second-post',
          title: 'Second Post',
          description: 'Description 2',
          firstPublished: '2024-01-02',
          featuredImage: null,
        },
        {
          id: '3',
          slug: 'third-post',
          title: 'Third Post',
          description: 'Description 3',
          firstPublished: '2024-01-03',
          featuredImage: null,
        },
      ]

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const result = await generateStaticParams()

      expect(result).toEqual([{ slug: 'first-post' }, { slug: 'second-post' }, { slug: 'third-post' }])
    })

    it('calls getPosts with ascending sort direction', async () => {
      vi.mocked(getPosts).mockResolvedValue(Ok([]))

      await generateStaticParams()

      expect(getPosts).toHaveBeenCalledWith({ sortDirection: 'ascending' })
    })

    it('returns empty array when no posts exist', async () => {
      vi.mocked(getPosts).mockResolvedValue(Ok([]))

      const result = await generateStaticParams()

      expect(result).toEqual([])
    })

    it('returns correct params structure for Next.js', async () => {
      const mockPosts = [
        {
          id: '1',
          slug: 'test-slug',
          title: 'Test',
          description: null,
          firstPublished: '2024-01-01',
          featuredImage: null,
        },
      ]

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const result = await generateStaticParams()

      // Verify structure matches Next.js expectation
      expect(result).toBeInstanceOf(Array)
      expect(result[0]).toHaveProperty('slug')
      expect(typeof result[0].slug).toBe('string')
      expect(Object.keys(result[0])).toEqual(['slug'])
    })
  })

  describe('error cases', () => {
    it('throws when getPosts returns Err', async () => {
      const error = new Error('Failed to fetch posts from Notion')
      vi.mocked(getPosts).mockResolvedValue(Err(error))

      // The .unwrap() call in generateStaticParams should throw
      await expect(generateStaticParams()).rejects.toThrow('Failed to fetch posts from Notion')
    })

    it('throws when getPosts rejects', async () => {
      const error = new Error('Network error')
      vi.mocked(getPosts).mockRejectedValue(error)

      await expect(generateStaticParams()).rejects.toThrow('Network error')
    })
  })
})

describe('DynamicRoute page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('success cases', () => {
    it('fetches and renders post with blocks and navigation', async () => {
      const mockPost = {
        id: '123',
        slug: 'test-post',
        title: 'Test Post',
        description: 'Test description',
        firstPublished: '2024-01-15',
        featuredImage: null,
        blocks: [
          {
            type: 'paragraph',
            richText: [{ type: 'text', text: 'Test content' }],
          },
        ],
        prevPost: {
          slug: 'previous-post',
          title: 'Previous Post',
        },
        nextPost: {
          slug: 'next-post',
          title: 'Next Post',
        },
      }

      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      const params = Promise.resolve({ slug: 'test-post' })
      const searchParams = Promise.resolve({})
      const result = await DynamicRoute({ params, searchParams })

      expect(getPost).toHaveBeenCalledWith({
        slug: 'test-post',
        includeBlocks: true,
        includePrevAndNext: true,
        skipCache: false,
      })

      expect(result.type).toBeDefined()
      expect(result.props).toBeDefined()
    })

    it('passes skipCache=true when nocache query param is present', async () => {
      const mockPost = {
        id: '123',
        slug: 'test-post',
        title: 'Test Post',
        description: null,
        firstPublished: '2024-01-15',
        featuredImage: null,
        blocks: [],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      const params = Promise.resolve({ slug: 'test-post' })
      const searchParams = Promise.resolve({ nocache: 'true' })
      await DynamicRoute({ params, searchParams })

      expect(getPost).toHaveBeenCalledWith({
        slug: 'test-post',
        includeBlocks: true,
        includePrevAndNext: true,
        skipCache: true,
      })
    })

    it('passes skipCache=false when nocache is not "true"', async () => {
      const mockPost = {
        id: '123',
        slug: 'test-post',
        title: 'Test Post',
        description: null,
        firstPublished: '2024-01-15',
        featuredImage: null,
        blocks: [],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      const params = Promise.resolve({ slug: 'test-post' })
      const searchParams = Promise.resolve({ nocache: 'false' })
      await DynamicRoute({ params, searchParams })

      expect(getPost).toHaveBeenCalledWith({
        slug: 'test-post',
        includeBlocks: true,
        includePrevAndNext: true,
        skipCache: false,
      })
    })

    it('calls getPost with correct options', async () => {
      const mockPost = {
        id: '123',
        slug: 'my-post',
        title: 'My Post',
        description: null,
        firstPublished: '2024-01-15',
        featuredImage: null,
        blocks: [],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      const params = Promise.resolve({ slug: 'my-post' })
      const searchParams = Promise.resolve({})
      await DynamicRoute({ params, searchParams })

      expect(getPost).toHaveBeenCalledWith({
        slug: 'my-post',
        includeBlocks: true,
        includePrevAndNext: true,
        skipCache: false,
      })
    })
  })

  describe('notFound behavior', () => {
    it('calls notFound() when post is null', async () => {
      vi.mocked(getPost).mockResolvedValue(Ok(null))
      vi.mocked(notFound).mockImplementation(() => {
        throw new Error('NEXT_NOT_FOUND')
      })

      const params = Promise.resolve({ slug: 'nonexistent-post' })
      const searchParams = Promise.resolve({})

      await expect(DynamicRoute({ params, searchParams })).rejects.toThrow('NEXT_NOT_FOUND')
      expect(notFound).toHaveBeenCalled()
    })

    it('calls notFound() when post does not exist', async () => {
      vi.mocked(getPost).mockResolvedValue(Ok(null))
      vi.mocked(notFound).mockImplementation(() => {
        throw new Error('NEXT_NOT_FOUND')
      })

      const params = Promise.resolve({ slug: 'missing-post' })
      const searchParams = Promise.resolve({})

      await expect(DynamicRoute({ params, searchParams })).rejects.toThrow('NEXT_NOT_FOUND')
      expect(notFound).toHaveBeenCalled()
    })
  })

  describe('error cases', () => {
    it('throws when getPost returns Err', async () => {
      const error = new Error('Failed to fetch post from Notion')
      vi.mocked(getPost).mockResolvedValue(Err(error))

      const params = Promise.resolve({ slug: 'test-post' })
      const searchParams = Promise.resolve({})

      // The .unwrap() call should throw, causing build to fail
      await expect(DynamicRoute({ params, searchParams })).rejects.toThrow('Failed to fetch post from Notion')
    })

    it('throws when getPost rejects', async () => {
      const error = new Error('Network error')
      vi.mocked(getPost).mockRejectedValue(error)

      const params = Promise.resolve({ slug: 'test-post' })
      const searchParams = Promise.resolve({})

      await expect(DynamicRoute({ params, searchParams })).rejects.toThrow('Network error')
    })
  })
})

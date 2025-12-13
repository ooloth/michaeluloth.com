import { generateStaticParams } from './page'
import getPosts from '@/lib/notion/getPosts'
import { Ok, Err } from '@/utils/result'

// Mock dependencies
vi.mock('@/lib/notion/getPosts')

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

/**
 * @vitest-environment happy-dom
 */

import { render, screen } from '@testing-library/react'
import { generateStaticParams } from './page'
import DynamicRoute from './page'
import getPosts from '@/io/notion/getPosts'
import getPost from '@/io/notion/getPost'
import { notFound } from 'next/navigation'
import { Ok, Err } from '@/utils/errors/result'

// Mock dependencies
vi.mock('@/io/notion/getPosts')
vi.mock('@/io/notion/getPost')
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
        lastEditedTime: '2024-01-15T00:00:00.000Z',
        featuredImage: null,
        blocks: [
          {
            type: 'paragraph' as const,
            richText: [
              {
                type: 'text' as const,
                content: 'Test content',
                link: null,
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
              },
            ],
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
      const jsx = await DynamicRoute({ params, searchParams })
      render(jsx)

      expect(getPost).toHaveBeenCalledWith({
        slug: 'test-post',
        includeBlocks: true,
        includePrevAndNext: true,
        skipCache: false,
      })

      // Verify post content is rendered
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Post')
      expect(screen.getByText('Test content')).toBeInTheDocument()

      // Verify navigation links (accessible name is just the post title with non-breaking space)
      const links = screen.getAllByRole('link')
      const previousLink = links.find(link => link.getAttribute('href') === '/previous-post/')
      const nextLink = links.find(link => link.getAttribute('href') === '/next-post/')

      expect(previousLink).toHaveAccessibleName('Previous\u00A0Post')
      expect(nextLink).toHaveAccessibleName('Next\u00A0Post')
    })

    it('passes skipCache=true when nocache query param is present', async () => {
      const mockPost = {
        id: '123',
        slug: 'test-post',
        title: 'Test Post',
        description: null,
        firstPublished: '2024-01-15',
        lastEditedTime: '2024-01-15T00:00:00.000Z',
        featuredImage: null,
        blocks: [],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      const params = Promise.resolve({ slug: 'test-post' })
      const searchParams = Promise.resolve({ nocache: 'true' })
      const jsx = await DynamicRoute({ params, searchParams })
      render(jsx)

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
        lastEditedTime: '2024-01-15T00:00:00.000Z',
        featuredImage: null,
        blocks: [],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      const params = Promise.resolve({ slug: 'test-post' })
      const searchParams = Promise.resolve({ nocache: 'false' })
      const jsx = await DynamicRoute({ params, searchParams })
      render(jsx)

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
        lastEditedTime: '2024-01-15T00:00:00.000Z',
        featuredImage: null,
        blocks: [],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      const params = Promise.resolve({ slug: 'my-post' })
      const searchParams = Promise.resolve({})
      const jsx = await DynamicRoute({ params, searchParams })
      render(jsx)

      expect(getPost).toHaveBeenCalledWith({
        slug: 'my-post',
        includeBlocks: true,
        includePrevAndNext: true,
        skipCache: false,
      })

      // Verify post title is rendered
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('My Post')
    })

    it('renders post without navigation when prevPost and nextPost are null', async () => {
      const mockPost = {
        id: '123',
        slug: 'standalone-post',
        title: 'Standalone Post',
        description: null,
        firstPublished: '2024-01-15',
        lastEditedTime: '2024-01-15T00:00:00.000Z',
        featuredImage: null,
        blocks: [],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      const params = Promise.resolve({ slug: 'standalone-post' })
      const searchParams = Promise.resolve({})
      const jsx = await DynamicRoute({ params, searchParams })
      render(jsx)

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Standalone Post')

      // No navigation links should be present
      const links = screen.queryAllByRole('link')
      const navLinks = links.filter(
        link => link.textContent?.includes('Previous') || link.textContent?.includes('Next'),
      )
      expect(navLinks.length).toBe(0)
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

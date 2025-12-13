import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { ReactElement } from 'react'
import Blog from './page'
import getPosts from '@/lib/notion/getPosts'
import type { PostListItem } from '@/lib/notion/schemas/post'
import { Ok, Err } from '@/utils/result'

// Mock dependencies
vi.mock('@/lib/notion/getPosts')

describe('Blog page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('success cases', () => {
    it('fetches and renders posts with descending sort', async () => {
      const mockPosts: PostListItem[] = [
        {
          id: '1',
          slug: 'newest-post',
          title: 'Newest Post',
          description: 'Most recent',
          firstPublished: '2024-03-15',
          featuredImage: null,
        },
        {
          id: '2',
          slug: 'older-post',
          title: 'Older Post',
          description: 'Earlier post',
          firstPublished: '2024-01-15',
          featuredImage: null,
        },
      ]

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const searchParams = Promise.resolve({})
      const result = (await Blog({ searchParams })) as ReactElement

      expect(getPosts).toHaveBeenCalledWith({ sortDirection: 'descending', skipCache: false })
      expect(result.type).toBe('main')
      expect((result.props as { children: unknown }).children).toBeDefined()
    })

    it('passes skipCache=true when nocache query param is present', async () => {
      const mockPosts = [
        {
          id: '1',
          slug: 'test-post',
          title: 'Test Post',
          description: null,
          firstPublished: '2024-01-15',
          featuredImage: null,
        },
      ]

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const searchParams = Promise.resolve({ nocache: 'true' })
      await Blog({ searchParams })

      expect(getPosts).toHaveBeenCalledWith({ sortDirection: 'descending', skipCache: true })
    })

    it('passes skipCache=false when nocache is not "true"', async () => {
      const mockPosts: PostListItem[] = []

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const searchParams = Promise.resolve({ nocache: 'false' })
      await Blog({ searchParams })

      expect(getPosts).toHaveBeenCalledWith({ sortDirection: 'descending', skipCache: false })
    })

    it('handles empty posts array gracefully', async () => {
      vi.mocked(getPosts).mockResolvedValue(Ok([]))

      const searchParams = Promise.resolve({})
      const result = (await Blog({ searchParams })) as ReactElement

      expect(result.type).toBe('main')
      expect((result.props as { children: unknown }).children).toBeDefined()
    })

    it('renders posts with correct structure', async () => {
      const mockPosts = [
        {
          id: '123',
          slug: 'test-post',
          title: 'Test Post Title',
          description: 'Test description',
          firstPublished: '2024-01-15',
          featuredImage: null,
        },
      ]

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const searchParams = Promise.resolve({})
      const result = (await Blog({ searchParams })) as ReactElement

      // Verify the component structure
      expect(result.type).toBe('main')
      expect((result.props as { className: string }).className).toBe('flex-auto')

      // Find the posts list in the rendered output
      const mainChildren = (result.props as { children: ReactElement[] }).children
      expect(Array.isArray(mainChildren)).toBe(true)

      // Verify heading exists
      const heading = mainChildren[0]
      expect((heading.props as { level: number }).level).toBe(1)

      // Verify posts list exists
      const postsList = mainChildren[1]
      expect(postsList.type).toBe('ul')
      expect((postsList.props as { className: string }).className).toBe('mt-8 grid gap-8')
    })

    it('uses slug as fallback when title is missing', async () => {
      const mockPosts = [
        {
          id: '1',
          slug: 'fallback-slug',
          title: '', // Empty title
          description: null,
          firstPublished: '2024-01-15',
          featuredImage: null,
        },
      ]

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const searchParams = Promise.resolve({})
      const result = await Blog({ searchParams })

      // The component should still render without error
      expect(result.type).toBe('main')
    })
  })

  describe('error cases', () => {
    it('throws when getPosts returns Err', async () => {
      const error = new Error('Failed to fetch posts from Notion')
      vi.mocked(getPosts).mockResolvedValue(Err(error))

      const searchParams = Promise.resolve({})

      // The .unwrap() call should throw, causing build to fail
      await expect(Blog({ searchParams })).rejects.toThrow('Failed to fetch posts from Notion')
    })

    it('throws when getPosts rejects', async () => {
      const error = new Error('Network error')
      vi.mocked(getPosts).mockRejectedValue(error)

      const searchParams = Promise.resolve({})

      await expect(Blog({ searchParams })).rejects.toThrow('Network error')
    })
  })
})

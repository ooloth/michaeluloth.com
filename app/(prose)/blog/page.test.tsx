/**
 * @vitest-environment happy-dom
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Blog from './page'
import getPosts from '@/lib/notion/getPosts'
import type { PostListItem } from '@/lib/notion/schemas/post'
import { Ok, Err } from '@/utils/errors/result'

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
      const jsx = await Blog({ searchParams })
      render(jsx)

      expect(getPosts).toHaveBeenCalledWith({ sortDirection: 'descending', skipCache: false })

      // Verify page structure
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Blog')

      // Verify posts are rendered
      expect(screen.getByRole('link', { name: /newest post/i })).toHaveAttribute('href', '/newest-post/')
      expect(screen.getByRole('link', { name: /older post/i })).toHaveAttribute('href', '/older-post/')
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
      const jsx = await Blog({ searchParams })
      render(jsx)

      expect(getPosts).toHaveBeenCalledWith({ sortDirection: 'descending', skipCache: true })
    })

    it('passes skipCache=false when nocache is not "true"', async () => {
      const mockPosts: PostListItem[] = []

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const searchParams = Promise.resolve({ nocache: 'false' })
      const jsx = await Blog({ searchParams })
      render(jsx)

      expect(getPosts).toHaveBeenCalledWith({ sortDirection: 'descending', skipCache: false })
    })

    it('handles empty posts array gracefully', async () => {
      vi.mocked(getPosts).mockResolvedValue(Ok([]))

      const searchParams = Promise.resolve({})
      const jsx = await Blog({ searchParams })
      render(jsx)

      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Blog')

      // No posts should be rendered
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
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
      const jsx = await Blog({ searchParams })
      render(jsx)

      // Verify main element exists
      const main = screen.getByRole('main')
      expect(main).toHaveClass('flex-auto')

      // Verify heading exists
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Blog')

      // Verify post link exists with correct href
      expect(screen.getByRole('link', { name: /test post title/i })).toHaveAttribute('href', '/test-post/')
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
      const jsx = await Blog({ searchParams })
      render(jsx)

      // The component should still render without error
      expect(screen.getByRole('main')).toBeInTheDocument()

      // Link should still exist (using slug as fallback)
      expect(screen.getByRole('link')).toHaveAttribute('href', '/fallback-slug/')
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

/**
 * @vitest-environment happy-dom
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import PostList from './blog-post-list'
import getPosts from '@/io/notion/getPosts'
import type { PostListItem } from '@/io/notion/schemas/post'
import { Ok, Err } from '@/utils/errors/result'

// Mock dependencies
vi.mock('@/io/notion/getPosts')

describe('PostList component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('success cases', () => {
    it('renders posts with dates and links', async () => {
      const mockPosts: PostListItem[] = [
        {
          id: '1',
          slug: 'test-post',
          title: 'Test Post',
          description: 'Test description',
          firstPublished: '2024-03-15',
          featuredImage: null,
        },
        {
          id: '2',
          slug: 'another-post',
          title: 'Another Post',
          description: 'Another description',
          firstPublished: '2024-01-15',
          featuredImage: null,
        },
      ]

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const jsx = await PostList({})
      render(jsx)

      // Verify posts are rendered with correct links
      // Note: Next.js strips trailing slashes from href attributes
      const testPostLink = screen.getByRole('link', { name: /test post/i })
      expect(testPostLink).toHaveAttribute('href')
      expect(testPostLink.getAttribute('href')).toMatch(/\/test-post\/?/)

      const anotherPostLink = screen.getByRole('link', { name: /another post/i })
      expect(anotherPostLink).toHaveAttribute('href')
      expect(anotherPostLink.getAttribute('href')).toMatch(/\/another-post\/?/)

      // Verify dates are rendered (dates are localized based on system timezone)
      expect(screen.getByText(/mar \d{1,2}, 2024/i)).toBeInTheDocument()
      expect(screen.getByText(/jan \d{1,2}, 2024/i)).toBeInTheDocument()
    })

    it('calls getPosts with descending sort by default', async () => {
      vi.mocked(getPosts).mockResolvedValue(Ok([]))

      const jsx = await PostList({})
      render(jsx)

      expect(getPosts).toHaveBeenCalledWith({ sortDirection: 'descending', skipCache: false })
    })

    it('passes skipCache=true when specified', async () => {
      vi.mocked(getPosts).mockResolvedValue(Ok([]))

      const jsx = await PostList({ skipCache: true })
      render(jsx)

      expect(getPosts).toHaveBeenCalledWith({ sortDirection: 'descending', skipCache: true })
    })

    it('passes skipCache=false when specified', async () => {
      vi.mocked(getPosts).mockResolvedValue(Ok([]))

      const jsx = await PostList({ skipCache: false })
      render(jsx)

      expect(getPosts).toHaveBeenCalledWith({ sortDirection: 'descending', skipCache: false })
    })

    it('limits posts to specified limit', async () => {
      const mockPosts: PostListItem[] = [
        {
          id: '1',
          slug: 'post-1',
          title: 'First Post',
          description: 'Test description',
          firstPublished: '2024-03-15',
          featuredImage: null,
        },
        {
          id: '2',
          slug: 'post-2',
          title: 'Second Post',
          description: 'Test description',
          firstPublished: '2024-03-14',
          featuredImage: null,
        },
        {
          id: '3',
          slug: 'post-3',
          title: 'Third Post',
          description: 'Test description',
          firstPublished: '2024-03-13',
          featuredImage: null,
        },
      ]

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const jsx = await PostList({ limit: 2 })
      render(jsx)

      // First 2 posts should be rendered
      expect(screen.getByRole('link', { name: /first post/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /second post/i })).toBeInTheDocument()

      // Third post should NOT be rendered
      expect(screen.queryByRole('link', { name: /third post/i })).not.toBeInTheDocument()
    })

    it('renders all posts when limit is not specified (defaults to 999)', async () => {
      // Create 10 posts
      const mockPosts: PostListItem[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        slug: `post-${i + 1}`,
        title: `Post ${i + 1}`,
        description: 'Test description',
        firstPublished: '2024-01-15',
        featuredImage: null,
      }))

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const jsx = await PostList({})
      render(jsx)

      // All 10 posts should be rendered
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(10)
    })

    it('handles empty posts array gracefully', async () => {
      vi.mocked(getPosts).mockResolvedValue(Ok([]))

      const jsx = await PostList({})
      render(jsx)

      // Should render an empty list
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })

    it('uses slug as fallback when title is empty', async () => {
      const mockPosts: PostListItem[] = [
        {
          id: '1',
          slug: 'my-slug',
          title: '', // Empty title
          description: 'Test description',
          firstPublished: '2024-01-15',
          featuredImage: null,
        },
      ]

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const jsx = await PostList({})
      render(jsx)

      // Should render link with slug as text
      const link = screen.getByRole('link', { name: 'my-slug' })
      expect(link).toHaveAttribute('href')
      expect(link.getAttribute('href')).toMatch(/\/my-slug\/?/)
    })

    it('renders correct post structure with time elements', async () => {
      const mockPosts: PostListItem[] = [
        {
          id: '1',
          slug: 'test-post',
          title: 'Test Post',
          description: 'Test description',
          firstPublished: '2024-03-15',
          featuredImage: null,
        },
      ]

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const jsx = await PostList({})
      render(jsx)

      // Verify time element exists with correct datetime attribute
      // Date text varies by timezone, so we search for a time element
      const timeElements = screen.getAllByRole('time')
      expect(timeElements).toHaveLength(1)
      const timeElement = timeElements[0]
      expect(timeElement.tagName).toBe('TIME')
      // datetime attribute is ISO string
      expect(timeElement).toHaveAttribute('datetime')
      expect(timeElement.getAttribute('datetime')).toMatch(/2024-03-15T/)
    })
  })

  describe('error cases', () => {
    it('throws when getPosts returns Err', async () => {
      const error = new Error('Failed to fetch posts from Notion')
      vi.mocked(getPosts).mockResolvedValue(Err(error))

      // The .unwrap() call should throw, causing build to fail
      await expect(PostList({})).rejects.toThrow('Failed to fetch posts from Notion')
    })

    it('throws when getPosts rejects', async () => {
      const error = new Error('Network error')
      vi.mocked(getPosts).mockRejectedValue(error)

      await expect(PostList({})).rejects.toThrow('Network error')
    })
  })
})

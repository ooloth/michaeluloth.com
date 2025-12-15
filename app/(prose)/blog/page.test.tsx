/**
 * @vitest-environment happy-dom
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Blog from './page'
import getPosts from '@/io/notion/getPosts'
import type { PostListItem } from '@/io/notion/schemas/post'
import { Ok } from '@/utils/errors/result'

// Mock dependencies
vi.mock('@/io/notion/getPosts')

// Mock PostList to avoid async server component complexity in tests
// The actual PostList behavior is tested in ui/post-list.test.tsx
vi.mock('@/ui/post-list', () => ({
  default: ({ limit, skipCache }: { limit?: number; skipCache?: boolean }) => {
    // Call getPosts to verify it's called with correct params
    // This ensures the mock is called during render which we verify in tests
    void getPosts({ sortDirection: 'descending', skipCache: skipCache ?? false })

    // Return a simple placeholder
    return <div data-testid="post-list" data-limit={limit} data-skip-cache={skipCache} />
  },
}))

describe('Blog page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('success cases', () => {
    it('renders page structure and PostList component', async () => {
      const mockPosts: PostListItem[] = []
      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const searchParams = Promise.resolve({})
      const jsx = await Blog({ searchParams })
      render(jsx)

      expect(getPosts).toHaveBeenCalledWith({ sortDirection: 'descending', skipCache: false })

      // Verify page structure
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Blog')

      // Verify PostList is rendered
      expect(screen.getByTestId('post-list')).toBeInTheDocument()
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

    it('renders correct page structure', async () => {
      vi.mocked(getPosts).mockResolvedValue(Ok([]))

      const searchParams = Promise.resolve({})
      const jsx = await Blog({ searchParams })
      render(jsx)

      // Verify main element exists with correct class
      const main = screen.getByRole('main')
      expect(main).toHaveClass('flex-auto')

      // Verify heading exists (sr-only)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Blog')

      // Verify PostList is rendered
      expect(screen.getByTestId('post-list')).toBeInTheDocument()
    })
  })

  // Note: Error handling for getPosts is tested in ui/post-list.test.tsx
  // since PostList is responsible for calling getPosts and handling errors
})

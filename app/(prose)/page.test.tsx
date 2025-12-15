/**
 * @vitest-environment happy-dom
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from './page'
import getPosts from '@/io/notion/getPosts'
import type { PostListItem } from '@/io/notion/schemas/post'
import { Ok, Err } from '@/utils/errors/result'

// Mock dependencies
vi.mock('@/io/notion/getPosts')
vi.mock('@/ui/image', () => ({
  default: ({ url }: { url: string }) => <img src={url} alt="Michael Uloth" />,
}))

// Mock PostList to avoid async server component complexity in tests
// The actual PostList behavior is tested in ui/post-list.test.tsx
vi.mock('@/ui/post-list', () => ({
  default: ({ limit, skipCache }: { limit?: number; skipCache?: boolean }) => {
    // Call getPosts to verify it's called with correct params
    // In tests, this will use the mocked version
    const mockCall = getPosts({ sortDirection: 'descending', skipCache: skipCache ?? false })

    // Return a simple placeholder that indicates PostList was rendered
    return <div data-testid="post-list" data-limit={limit} data-skip-cache={skipCache} />
  },
}))

describe('Home page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('success cases', () => {
    it('renders the Summary section with bio and image', async () => {
      const mockPosts: PostListItem[] = []
      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const searchParams = Promise.resolve({})
      const jsx = await Home({ searchParams })
      render(jsx)

      // Verify main element
      expect(screen.getByRole('main')).toBeInTheDocument()

      // Verify bio heading
      expect(screen.getByRole('heading', { level: 2, name: /hey, i'm michael/i })).toBeInTheDocument()

      // Verify bio text is present
      expect(screen.getByText(/i write code for a living/i)).toBeInTheDocument()
      expect(screen.getByText(/i've built dozens of polished uis/i)).toBeInTheDocument()

      // Verify image is present
      expect(screen.getByAltText('Michael Uloth')).toBeInTheDocument()
    })

    it('renders Recent Writing section heading', async () => {
      const mockPosts: PostListItem[] = []
      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const searchParams = Promise.resolve({})
      const jsx = await Home({ searchParams })
      render(jsx)

      expect(screen.getByRole('heading', { level: 2, name: /recent writing/i })).toBeInTheDocument()
    })

    it('renders PostList with limit of 5 posts', async () => {
      const mockPosts: PostListItem[] = []
      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const searchParams = Promise.resolve({})
      const jsx = await Home({ searchParams })
      render(jsx)

      // Verify PostList is rendered with correct props
      const postList = screen.getByTestId('post-list')
      expect(postList).toBeInTheDocument()
      expect(postList).toHaveAttribute('data-limit', '5')
      expect(postList).toHaveAttribute('data-skip-cache', 'false')
    })

    it('passes skipCache=true when nocache query param is present', async () => {
      const mockPosts: PostListItem[] = []
      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const searchParams = Promise.resolve({ nocache: 'true' })
      const jsx = await Home({ searchParams })
      render(jsx)

      expect(getPosts).toHaveBeenCalledWith({ sortDirection: 'descending', skipCache: true })
    })

    it('passes skipCache=false when nocache is not "true"', async () => {
      const mockPosts: PostListItem[] = []
      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const searchParams = Promise.resolve({ nocache: 'false' })
      const jsx = await Home({ searchParams })
      render(jsx)

      expect(getPosts).toHaveBeenCalledWith({ sortDirection: 'descending', skipCache: false })
    })

    it('passes skipCache=false by default when no query params', async () => {
      const mockPosts: PostListItem[] = []
      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const searchParams = Promise.resolve({})
      const jsx = await Home({ searchParams })
      render(jsx)

      expect(getPosts).toHaveBeenCalledWith({ sortDirection: 'descending', skipCache: false })
    })

    it('handles empty posts array gracefully', async () => {
      vi.mocked(getPosts).mockResolvedValue(Ok([]))

      const searchParams = Promise.resolve({})
      const jsx = await Home({ searchParams })
      render(jsx)

      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: /hey, i'm michael/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: /recent writing/i })).toBeInTheDocument()
    })

    it('renders correct page structure', async () => {
      const mockPosts: PostListItem[] = []
      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const searchParams = Promise.resolve({})
      const jsx = await Home({ searchParams })
      render(jsx)

      // Verify main element has correct class
      const main = screen.getByRole('main')
      expect(main).toHaveClass('flex-auto')

      // Verify both sections are present
      expect(screen.getByRole('heading', { level: 2, name: /hey, i'm michael/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: /recent writing/i })).toBeInTheDocument()
    })
  })

  // Note: Error handling for getPosts is tested in ui/post-list.test.tsx
  // since PostList is responsible for calling getPosts and handling errors
})

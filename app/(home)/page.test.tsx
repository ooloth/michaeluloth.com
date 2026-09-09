/**
 * @vitest-environment happy-dom
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from './page'
import getPosts from '@/io/notion/getPosts'
import type { PostListItem } from '@/io/notion/schemas/post'
import { Ok, Err } from '@/utils/errors/result'
import { createPostListItem } from '@/io/notion/testing/post-factories'

// Mock dependencies
vi.mock('@/io/notion/getPosts')
vi.mock('@/ui/elements/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element -- Using img in test mock is acceptable
  default: ({ url }: { url: string }) => <img src={url} alt="Michael Uloth" />,
}))

// Mock PostList so these tests cover what the page composes, not how the list renders.
// The list's own rendering is tested in ui/sections/blog-post-list.test.tsx.
vi.mock('@/ui/sections/blog-post-list', () => ({
  default: ({ posts }: { posts: PostListItem[] }) => <div data-testid="post-list" data-count={posts.length} />,
}))

// Mock PageLayout to avoid Next.js usePathname() in Header component
vi.mock('@/ui/layout/page-layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <main id="main" className="flex-auto flex flex-col">
      {children}
    </main>
  ),
}))

describe('Home page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('success cases', () => {
    it('renders the Summary section with bio and image', async () => {
      const mockPosts: PostListItem[] = []
      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const jsx = await Home()
      render(jsx)

      // Verify main element
      expect(screen.getByRole('main')).toBeInTheDocument()

      // Verify bio heading
      expect(screen.getByRole('heading', { level: 1, name: /hey, i'm michael/i })).toBeInTheDocument()

      // Verify bio text is present
      expect(screen.getByText(/i write code for a living/i)).toBeInTheDocument()
      expect(screen.getByText(/i've built dozens of polished uis/i)).toBeInTheDocument()

      // Verify image is present
      expect(screen.getByAltText('Michael Uloth')).toBeInTheDocument()
    })

    it('renders Recent Writing section heading', async () => {
      const mockPosts: PostListItem[] = []
      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const jsx = await Home()
      render(jsx)

      expect(screen.getByRole('heading', { level: 2, name: /recent writing/i })).toBeInTheDocument()
    })

    it('passes only the 5 most recent posts to Recent Writing', async () => {
      const mockPosts: PostListItem[] = Array.from({ length: 8 }, (_, i) =>
        createPostListItem({ id: `${i + 1}`, slug: `post-${i + 1}` }),
      )
      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const jsx = await Home()
      render(jsx)

      expect(screen.getByTestId('post-list')).toHaveAttribute('data-count', '5')
    })

    it('handles empty posts array gracefully', async () => {
      vi.mocked(getPosts).mockResolvedValue(Ok([]))

      const jsx = await Home()
      render(jsx)

      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1, name: /hey, i'm michael/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: /recent writing/i })).toBeInTheDocument()
    })

    it('renders correct page structure', async () => {
      const mockPosts: PostListItem[] = []
      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const jsx = await Home()
      render(jsx)

      // Verify main element has correct class and id for skip link
      const main = screen.getByRole('main')
      expect(main).toHaveClass('flex-auto')
      expect(main).toHaveAttribute('id', 'main')

      // Verify both sections are present
      expect(screen.getByRole('heading', { level: 1, name: /hey, i'm michael/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: /recent writing/i })).toBeInTheDocument()
    })
  })

  describe('error cases', () => {
    it('throws when getPosts returns Err so the build fails', async () => {
      vi.mocked(getPosts).mockResolvedValue(Err(new Error('Failed to fetch posts from Notion')))

      await expect(Home()).rejects.toThrow('Failed to fetch posts from Notion')
    })

    it('throws when getPosts rejects', async () => {
      vi.mocked(getPosts).mockRejectedValue(new Error('Network error'))

      await expect(Home()).rejects.toThrow('Network error')
    })
  })
})

/**
 * @vitest-environment happy-dom
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Blog, { metadata } from './page'
import getPosts from '@/io/notion/getPosts'
import type { PostListItem } from '@/io/notion/schemas/post'
import { Ok, Err } from '@/utils/errors/result'
import { SITE_LOCALE, TWITTER_CARD } from '@/seo/constants'
import { createPostListItem } from '@/io/notion/testing/post-factories'

// Mock dependencies
vi.mock('@/io/notion/getPosts')

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

describe('Blog page metadata', () => {
  it('exports metadata with title and description', () => {
    expect(metadata).toEqual({
      title: 'Blog',
      description: 'Technical writing about web development, TypeScript, React, and software engineering.',
      openGraph: {
        type: 'website',
        url: 'https://michaeluloth.com/blog/',
        siteName: 'Michael Uloth',
        locale: SITE_LOCALE,
        images: ['/og-image.png'],
      },
      twitter: {
        card: TWITTER_CARD,
        creator: '@ooloth',
        title: 'Blog',
        description: 'Technical writing about web development, TypeScript, React, and software engineering.',
        images: ['/og-image.png'],
      },
    })
  })
})

describe('Blog page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('success cases', () => {
    it('passes every fetched post to the post list', async () => {
      const mockPosts: PostListItem[] = [
        createPostListItem({ id: '1', slug: 'a' }),
        createPostListItem({ id: '2', slug: 'b' }),
        createPostListItem({ id: '3', slug: 'c' }),
      ]
      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const jsx = await Blog()
      render(jsx)

      // The blog archive is unlimited: every post fetched reaches the list
      expect(screen.getByTestId('post-list')).toHaveAttribute('data-count', '3')
    })

    it('requests posts in descending order so the newest appear first', async () => {
      vi.mocked(getPosts).mockResolvedValue(Ok([]))

      await Blog()

      expect(getPosts).toHaveBeenCalledWith({ sortDirection: 'descending' })
    })

    it('renders correct page structure', async () => {
      vi.mocked(getPosts).mockResolvedValue(Ok([]))

      const jsx = await Blog()
      render(jsx)

      // Verify main element exists with correct class and id for skip link
      const main = screen.getByRole('main')
      expect(main).toHaveClass('flex-auto')
      expect(main).toHaveAttribute('id', 'main')

      // Verify heading exists (sr-only)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Blog')

      // Verify PostList is rendered
      expect(screen.getByTestId('post-list')).toBeInTheDocument()
    })
  })

  describe('error cases', () => {
    it('throws when getPosts returns Err so the build fails', async () => {
      vi.mocked(getPosts).mockResolvedValue(Err(new Error('Failed to fetch posts from Notion')))

      await expect(Blog()).rejects.toThrow('Failed to fetch posts from Notion')
    })

    it('throws when getPosts rejects', async () => {
      vi.mocked(getPosts).mockRejectedValue(new Error('Network error'))

      await expect(Blog()).rejects.toThrow('Network error')
    })
  })
})

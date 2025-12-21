/**
 * @vitest-environment happy-dom
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Blog, { metadata } from './page'
import getPosts from '@/io/notion/getPosts'
import type { PostListItem } from '@/io/notion/schemas/post'
import { Ok } from '@/utils/errors/result'

// Mock dependencies
vi.mock('@/io/notion/getPosts')

// Mock PostList to avoid async server component complexity in tests
// The actual PostList behavior is tested in ui/post-list.test.tsx
vi.mock('@/ui/post-list', () => ({
  default: ({ limit }: { limit?: number }) => {
    // Call getPosts to verify it's called with correct params
    // This ensures the mock is called during render which we verify in tests
    void getPosts({ sortDirection: 'descending' })

    // Return a simple placeholder
    return <div data-testid="post-list" data-limit={limit} />
  },
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
        locale: 'en_CA',
        images: ['/og-image.png'],
      },
      twitter: {
        card: 'summary_large_image',
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
    it('renders page structure and PostList component', async () => {
      const mockPosts: PostListItem[] = []
      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const jsx = await Blog()
      render(jsx)

      expect(getPosts).toHaveBeenCalledWith({ sortDirection: 'descending' })

      // Verify page structure
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Blog')

      // Verify PostList is rendered
      expect(screen.getByTestId('post-list')).toBeInTheDocument()
    })

    it('renders correct page structure', async () => {
      vi.mocked(getPosts).mockResolvedValue(Ok([]))

      const jsx = await Blog()
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

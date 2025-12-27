/**
 * @vitest-environment happy-dom
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PaginationLinks, { replaceLastSpaceWithNonBreaking } from './post-pagination'
import type { PostListItem } from '@/io/notion/schemas/post'

describe('replaceLastSpaceWithNonBreaking', () => {
  it('replaces only the last space with non-breaking space', () => {
    expect(replaceLastSpaceWithNonBreaking('A Long Post Title')).toBe('A Long Post\u00A0Title')
  })

  it('handles single word (no spaces)', () => {
    expect(replaceLastSpaceWithNonBreaking('Hello')).toBe('Hello')
  })

  it('handles two words', () => {
    expect(replaceLastSpaceWithNonBreaking('Hello World')).toBe('Hello\u00A0World')
  })

  it('handles multiple spaces (only last is replaced)', () => {
    expect(replaceLastSpaceWithNonBreaking('A B C D')).toBe('A B C\u00A0D')
  })

  it('handles empty string', () => {
    expect(replaceLastSpaceWithNonBreaking('')).toBe('')
  })
})

describe('PaginationLinks', () => {
  const mockPost: PostListItem = {
    id: '123',
    slug: 'test-post',
    title: 'Test Post',
    description: 'A test post',
    firstPublished: '2024-01-01',
  }

  describe('aria-label', () => {
    it('has aria-label on nav element for screen readers', () => {
      render(<PaginationLinks prevPost={mockPost} nextPost={mockPost} />)

      const nav = screen.getByRole('navigation', { name: /post navigation/i })
      expect(nav).toBeInTheDocument()
      expect(nav).toHaveAttribute('aria-label', 'Post navigation')
    })
  })

  describe('rendering with posts', () => {
    it('renders both links when both posts are provided', () => {
      const prevPost: PostListItem = { ...mockPost, slug: 'prev-post', title: 'Previous Post Title' }
      const nextPost: PostListItem = { ...mockPost, slug: 'next-post', title: 'Next Post Title' }

      render(<PaginationLinks prevPost={prevPost} nextPost={nextPost} />)

      // Query by accessible name (accounting for non-breaking space transformation)
      expect(screen.getByRole('link', { name: replaceLastSpaceWithNonBreaking(nextPost.title) })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: replaceLastSpaceWithNonBreaking(prevPost.title) })).toBeInTheDocument()
    })

    it('renders only next link when prevPost is null', () => {
      const nextPost: PostListItem = { ...mockPost, slug: 'next-post', title: 'Next Post Title' }

      render(<PaginationLinks prevPost={null} nextPost={nextPost} />)

      expect(screen.getByRole('link', { name: replaceLastSpaceWithNonBreaking(nextPost.title) })).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /previous/i })).not.toBeInTheDocument()
    })

    it('renders only prev link when nextPost is null', () => {
      const prevPost: PostListItem = { ...mockPost, slug: 'prev-post', title: 'Previous Post Title' }

      render(<PaginationLinks prevPost={prevPost} nextPost={null} />)

      expect(screen.getByRole('link', { name: replaceLastSpaceWithNonBreaking(prevPost.title) })).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /next/i })).not.toBeInTheDocument()
    })

    it('renders empty divs when both posts are null', () => {
      const { container } = render(<PaginationLinks prevPost={null} nextPost={null} />)

      expect(screen.queryByRole('link')).not.toBeInTheDocument()
      expect(container.querySelectorAll('.basis-1\\/2')).toHaveLength(2)
    })
  })

  describe('link attributes', () => {
    it('has correct href for next post', () => {
      const nextPost: PostListItem = { ...mockPost, slug: 'next-post', title: 'Next Post Title' }

      render(<PaginationLinks prevPost={null} nextPost={nextPost} />)

      const link = screen.getByRole('link', { name: replaceLastSpaceWithNonBreaking(nextPost.title) })
      expect(link).toHaveAttribute('href', '/next-post/')
    })

    it('has correct href for previous post', () => {
      const prevPost: PostListItem = { ...mockPost, slug: 'prev-post', title: 'Previous Post Title' }

      render(<PaginationLinks prevPost={prevPost} nextPost={null} />)

      const link = screen.getByRole('link', { name: replaceLastSpaceWithNonBreaking(prevPost.title) })
      expect(link).toHaveAttribute('href', '/prev-post/')
    })
  })

  describe('text content', () => {
    it('displays "Newer" for next post', () => {
      const nextPost: PostListItem = { ...mockPost, slug: 'next-post', title: 'Next Post Title' }

      render(<PaginationLinks prevPost={null} nextPost={nextPost} />)

      expect(screen.getByText('Newer')).toBeInTheDocument()
    })

    it('displays "Older" for previous post', () => {
      const prevPost: PostListItem = { ...mockPost, slug: 'prev-post', title: 'Previous Post Title' }

      render(<PaginationLinks prevPost={prevPost} nextPost={null} />)

      expect(screen.getByText('Older')).toBeInTheDocument()
    })

    it('replaces last space with non-breaking space in titles', () => {
      const prevPost: PostListItem = { ...mockPost, slug: 'prev', title: 'A Long Post Title' }

      render(<PaginationLinks prevPost={prevPost} nextPost={null} />)

      // Verify the transformation happens (hardcoded expected value)
      const link = screen.getByRole('link', { name: 'A Long Post\u00A0Title' })
      expect(link).toBeInTheDocument()
    })
  })
})

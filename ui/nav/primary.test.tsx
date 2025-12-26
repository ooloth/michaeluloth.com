/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import PrimaryNav from './primary'
import type { PostListItem } from '@/io/notion/schemas/post'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

import { usePathname } from 'next/navigation'

const mockPosts: PostListItem[] = [
  {
    slug: 'first-post',
    title: 'First Post',
    description: 'Description',
    date: '2024-01-01',
    tags: [],
  },
  {
    slug: 'second-post',
    title: 'Second Post',
    description: 'Description',
    date: '2024-01-02',
    tags: [],
  },
]

describe('PrimaryNav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('navigation structure', () => {
    it('renders nav element with aria-label', () => {
      vi.mocked(usePathname).mockReturnValue('/')
      render(<PrimaryNav posts={mockPosts} />)

      const nav = screen.getByRole('navigation', { name: 'Primary navigation' })
      expect(nav).toBeInTheDocument()
    })

    it('renders navigation as unordered list', () => {
      vi.mocked(usePathname).mockReturnValue('/')
      render(<PrimaryNav posts={mockPosts} />)

      const list = screen.getByRole('list')
      expect(list).toBeInTheDocument()
    })
  })

  describe('header link', () => {
    it('renders site title link to home', () => {
      vi.mocked(usePathname).mockReturnValue('/')
      render(<PrimaryNav posts={mockPosts} />)

      const headerLink = screen.getByRole('link', { name: /Michael Uloth/ })
      expect(headerLink).toHaveAttribute('href', '/')
    })

    it('includes emoji in header link', () => {
      vi.mocked(usePathname).mockReturnValue('/')
      render(<PrimaryNav posts={mockPosts} />)

      const headerLink = screen.getByRole('link', { name: /Michael Uloth/ })
      expect(headerLink.textContent).toContain('👋')
    })
  })

  describe('navigation links', () => {
    it('renders all navigation items', () => {
      vi.mocked(usePathname).mockReturnValue('/')
      render(<PrimaryNav posts={mockPosts} />)

      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Blog' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Likes' })).toBeInTheDocument()
    })

    it.each([
      { name: 'Home', href: '/' },
      { name: 'Blog', href: '/blog' },
      { name: 'Likes', href: '/likes' },
    ])('renders $name link with correct href', ({ name, href }) => {
      vi.mocked(usePathname).mockReturnValue('/')
      render(<PrimaryNav posts={mockPosts} />)

      const link = screen.getByRole('link', { name })
      // Next.js Link normalizes trailing slashes in the rendered href
      expect(link).toHaveAttribute('href', href)
    })

    it('applies link-nav class to navigation links', () => {
      vi.mocked(usePathname).mockReturnValue('/')
      render(<PrimaryNav posts={mockPosts} />)

      const homeLink = screen.getByRole('link', { name: 'Home' })
      expect(homeLink).toHaveClass('link-nav')
    })
  })

  describe('aria-current for active page', () => {
    it('sets aria-current="page" for home when on home page', () => {
      vi.mocked(usePathname).mockReturnValue('/')
      render(<PrimaryNav posts={mockPosts} />)

      const homeLink = screen.getByRole('link', { name: 'Home' })
      expect(homeLink).toHaveAttribute('aria-current', 'page')
    })

    it('sets aria-current="page" for blog when on blog index', () => {
      vi.mocked(usePathname).mockReturnValue('/blog/')
      render(<PrimaryNav posts={mockPosts} />)

      const blogLink = screen.getByRole('link', { name: 'Blog' })
      expect(blogLink).toHaveAttribute('aria-current', 'page')
    })

    it('sets aria-current="page" for blog when on a blog post', () => {
      vi.mocked(usePathname).mockReturnValue('/first-post/')
      render(<PrimaryNav posts={mockPosts} />)

      const blogLink = screen.getByRole('link', { name: 'Blog' })
      expect(blogLink).toHaveAttribute('aria-current', 'page')
    })

    it('sets aria-current="page" for likes when on likes page', () => {
      vi.mocked(usePathname).mockReturnValue('/likes/')
      render(<PrimaryNav posts={mockPosts} />)

      const likesLink = screen.getByRole('link', { name: 'Likes' })
      expect(likesLink).toHaveAttribute('aria-current', 'page')
    })

    it('does not set aria-current when on different page', () => {
      vi.mocked(usePathname).mockReturnValue('/blog/')
      render(<PrimaryNav posts={mockPosts} />)

      const homeLink = screen.getByRole('link', { name: 'Home' })
      expect(homeLink).not.toHaveAttribute('aria-current')

      const likesLink = screen.getByRole('link', { name: 'Likes' })
      expect(likesLink).not.toHaveAttribute('aria-current')
    })
  })

  describe('blog post detection', () => {
    it.each([
      { slug: 'first-post', title: 'First Post' },
      { slug: 'second-post', title: 'Second Post' },
    ])('marks blog as current when on /$slug/', ({ slug }) => {
      vi.mocked(usePathname).mockReturnValue(`/${slug}/`)
      render(<PrimaryNav posts={mockPosts} />)

      const blogLink = screen.getByRole('link', { name: 'Blog' })
      expect(blogLink).toHaveAttribute('aria-current', 'page')
    })

    it('does not mark blog as current for non-post paths', () => {
      vi.mocked(usePathname).mockReturnValue('/random-page/')
      render(<PrimaryNav posts={mockPosts} />)

      const blogLink = screen.getByRole('link', { name: 'Blog' })
      expect(blogLink).not.toHaveAttribute('aria-current')
    })
  })

  describe('edge cases', () => {
    it('handles empty posts array', () => {
      vi.mocked(usePathname).mockReturnValue('/')
      render(<PrimaryNav posts={[]} />)

      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Blog' })).toBeInTheDocument()
    })

    it('handles pathname without trailing slash', () => {
      vi.mocked(usePathname).mockReturnValue('/blog')
      render(<PrimaryNav posts={mockPosts} />)

      // Should not match (we expect trailing slashes)
      const blogLink = screen.getByRole('link', { name: 'Blog' })
      expect(blogLink).not.toHaveAttribute('aria-current')
    })
  })
})

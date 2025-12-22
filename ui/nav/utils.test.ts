import { describe, expect, it } from 'vitest'
import { isCurrentPage } from './utils'
import type { NavItem } from './types'
import type { PostListItem } from '@/io/notion/schemas/post'

describe('isCurrentPage', () => {
  const mockPosts: PostListItem[] = [
    {
      id: '1',
      slug: 'test-post',
      title: 'Test Post',
      description: "Test description",
      firstPublished: '2024-01-15',
      featuredImage: null,
    },
    {
      id: '2',
      slug: 'another-post',
      title: 'Another Post',
      description: "Test description",
      firstPublished: '2024-01-14',
      featuredImage: null,
    },
  ]

  describe('exact path matches', () => {
    it('returns true when navItem href exactly matches pathname', () => {
      const navItem: NavItem = { text: 'Home', href: '/' }
      expect(isCurrentPage(navItem, '/', mockPosts)).toBe(true)
    })

    it('returns true when navItem href matches pathname for /likes/', () => {
      const navItem: NavItem = { text: 'Likes', href: '/likes/' }
      expect(isCurrentPage(navItem, '/likes/', mockPosts)).toBe(true)
    })

    it('returns false when navItem href does not match pathname', () => {
      const navItem: NavItem = { text: 'Home', href: '/' }
      expect(isCurrentPage(navItem, '/blog/', mockPosts)).toBe(false)
    })
  })

  describe('blog post detection', () => {
    it('returns true when navItem is blog and pathname matches a post slug', () => {
      const navItem: NavItem = { text: 'Blog', href: '/blog/' }
      expect(isCurrentPage(navItem, '/test-post/', mockPosts)).toBe(true)
    })

    it('returns true when navItem is blog and pathname matches another post slug', () => {
      const navItem: NavItem = { text: 'Blog', href: '/blog/' }
      expect(isCurrentPage(navItem, '/another-post/', mockPosts)).toBe(true)
    })

    it('returns false when navItem is blog but pathname does not match any post slug', () => {
      const navItem: NavItem = { text: 'Blog', href: '/blog/' }
      expect(isCurrentPage(navItem, '/unknown-page/', mockPosts)).toBe(false)
    })

    it('returns true when navItem is blog and pathname is exactly /blog/', () => {
      const navItem: NavItem = { text: 'Blog', href: '/blog/' }
      expect(isCurrentPage(navItem, '/blog/', mockPosts)).toBe(true)
    })

    it('returns false when navItem is not blog and pathname matches a post slug', () => {
      const navItem: NavItem = { text: 'Home', href: '/' }
      expect(isCurrentPage(navItem, '/test-post/', mockPosts)).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('returns false when posts array is empty and checking blog post match', () => {
      const navItem: NavItem = { text: 'Blog', href: '/blog/' }
      expect(isCurrentPage(navItem, '/test-post/', [])).toBe(false)
    })

    it('handles pathnames without trailing slashes', () => {
      const navItem: NavItem = { text: 'Blog', href: '/blog/' }
      // This test assumes the actual pathname from Next.js includes the trailing slash
      // If the implementation needs to handle both, this test documents current behavior
      expect(isCurrentPage(navItem, '/test-post', mockPosts)).toBe(false)
    })

    it('returns false for empty pathname', () => {
      const navItem: NavItem = { text: 'Home', href: '/' }
      expect(isCurrentPage(navItem, '', mockPosts)).toBe(false)
    })
  })
})

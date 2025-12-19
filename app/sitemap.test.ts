/**
 * @vitest-environment happy-dom
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import sitemap from './sitemap'
import getPosts from '@/io/notion/getPosts'
import type { PostListItem } from '@/io/notion/schemas/post'
import { Ok } from '@/utils/errors/result'

// Mock dependencies
vi.mock('@/io/notion/getPosts')

describe('sitemap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('includes static pages with correct priorities', async () => {
    vi.mocked(getPosts).mockResolvedValue(Ok([]))

    const urls = await sitemap()

    const homePage = urls.find((u) => u.url === 'https://michaeluloth.com/')
    expect(homePage).toBeDefined()
    expect(homePage?.priority).toBe(1)

    const blogPage = urls.find((u) => u.url === 'https://michaeluloth.com/blog')
    expect(blogPage).toBeDefined()
    expect(blogPage?.priority).toBe(0.8)
    expect(blogPage?.changeFrequency).toBe('weekly')

    const likesPage = urls.find((u) => u.url === 'https://michaeluloth.com/likes')
    expect(likesPage).toBeDefined()
    expect(likesPage?.priority).toBe(0.5)
  })

  it('includes blog posts with lastModified dates', async () => {
    const mockPosts: PostListItem[] = [
      {
        id: 'post-1',
        slug: 'test-post',
        title: 'Test Post',
        description: null,
        firstPublished: '2024-01-15',
        featuredImage: null,
        feedId: null,
      },
      {
        id: 'post-2',
        slug: 'another-post',
        title: 'Another Post',
        description: null,
        firstPublished: '2024-02-20',
        featuredImage: null,
        feedId: null,
      },
    ]

    vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

    const urls = await sitemap()

    const post1 = urls.find((u) => u.url === 'https://michaeluloth.com/test-post/')
    expect(post1).toBeDefined()
    expect(post1?.lastModified).toEqual(new Date('2024-01-15'))
    expect(post1?.priority).toBe(0.7)

    const post2 = urls.find((u) => u.url === 'https://michaeluloth.com/another-post/')
    expect(post2).toBeDefined()
    expect(post2?.lastModified).toEqual(new Date('2024-02-20'))
    expect(post2?.priority).toBe(0.7)
  })

  it('fetches posts with descending sort order', async () => {
    vi.mocked(getPosts).mockResolvedValue(Ok([]))

    await sitemap()

    expect(getPosts).toHaveBeenCalledWith({ sortDirection: 'descending' })
  })

  it('returns all URLs (static pages + blog posts)', async () => {
    const mockPosts: PostListItem[] = [
      {
        id: 'post-1',
        slug: 'first-post',
        title: 'First Post',
        description: null,
        firstPublished: '2024-01-15',
        featuredImage: null,
        feedId: null,
      },
      {
        id: 'post-2',
        slug: 'second-post',
        title: 'Second Post',
        description: null,
        firstPublished: '2024-02-20',
        featuredImage: null,
        feedId: null,
      },
    ]

    vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

    const urls = await sitemap()

    // 3 static pages + 2 blog posts = 5 total
    expect(urls).toHaveLength(5)

    // Verify all URLs are present
    const urlStrings = urls.map((u) => u.url)
    expect(urlStrings).toContain('https://michaeluloth.com/')
    expect(urlStrings).toContain('https://michaeluloth.com/blog')
    expect(urlStrings).toContain('https://michaeluloth.com/likes')
    expect(urlStrings).toContain('https://michaeluloth.com/first-post/')
    expect(urlStrings).toContain('https://michaeluloth.com/second-post/')
  })

  it('handles empty blog posts list', async () => {
    vi.mocked(getPosts).mockResolvedValue(Ok([]))

    const urls = await sitemap()

    // Only 3 static pages
    expect(urls).toHaveLength(3)
    expect(urls.every((u) => u.url.startsWith('https://michaeluloth.com/'))).toBe(true)
  })
})

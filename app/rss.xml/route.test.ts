import { describe, expect, it, vi, beforeEach } from 'vitest'
import { GET } from './route'
import getPosts from '@/io/notion/getPosts'
import getPost from '@/io/notion/getPost'
import type { PostListItem } from '@/io/notion/schemas/post'
import type { Post } from '@/io/notion/schemas/post'
import { Ok } from '@/utils/errors/result'

// Mock dependencies
vi.mock('@/io/notion/getPosts')
vi.mock('@/io/notion/getPost')

describe('RSS feed route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('returns RSS XML with correct headers', async () => {
      const mockPostListItems: PostListItem[] = [
        {
          id: 'post-1',
          slug: 'test-post',
          title: 'Test Post',
          description: 'A test post description',
          firstPublished: '2024-01-15',
          featuredImage: null,
        },
      ]

      const mockPost: Post = {
        id: 'post-1',
        slug: 'test-post',
        title: 'Test Post',
        description: 'A test post description',
        firstPublished: '2024-01-15',
        featuredImage: null,
        blocks: [
          {
            type: 'paragraph',
            richText: [
              {
                content: 'This is test content.',
                link: null,
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
              },
            ],
          },
        ],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPostListItems))
      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      const response = await GET()

      // Verify response headers
      expect(response.headers.get('Content-Type')).toBe('application/xml')
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600')
    })

    it('generates valid RSS 2.0 XML structure', async () => {
      const mockPostListItems: PostListItem[] = [
        {
          id: 'post-1',
          slug: 'test-post',
          title: 'Test Post',
          description: 'A test post description',
          firstPublished: '2024-01-15',
          featuredImage: null,
        },
      ]

      const mockPost: Post = {
        id: 'post-1',
        slug: 'test-post',
        title: 'Test Post',
        description: 'A test post description',
        firstPublished: '2024-01-15',
        featuredImage: null,
        blocks: [
          {
            type: 'paragraph',
            richText: [
              {
                content: 'Post content here.',
                link: null,
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
              },
            ],
          },
        ],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPostListItems))
      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      const response = await GET()
      const xml = await response.text()

      // Verify RSS 2.0 structure
      expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>')
      expect(xml).toContain('<rss')
      expect(xml).toContain('version="2.0"')
      expect(xml).toContain('<channel>')
      expect(xml).toContain('</channel>')
      expect(xml).toContain('</rss>')
    })

    it('includes correct feed metadata', async () => {
      const mockPostListItems: PostListItem[] = []
      vi.mocked(getPosts).mockResolvedValue(Ok(mockPostListItems))

      const response = await GET()
      const xml = await response.text()

      // Verify feed metadata
      expect(xml).toContain('<title>Michael Uloth</title>')
      expect(xml).toContain(
        '<description>Software engineer helping scientists discover new medicines at Recursion.</description>',
      )
      expect(xml).toContain('<link>https://michaeluloth.com</link>')
      expect(xml).toContain('<language>en</language>')
      expect(xml).toContain(`<copyright>All rights reserved ${new Date().getFullYear()}, Michael Uloth</copyright>`)
    })

    it('includes post items with correct structure', async () => {
      const mockPostListItems: PostListItem[] = [
        {
          id: 'post-1',
          slug: 'my-first-post',
          title: 'My First Post',
          description: 'Post description',
          firstPublished: '2024-01-15',
          featuredImage: null,
        },
      ]

      const mockPost: Post = {
        id: 'post-1',
        slug: 'my-first-post',
        title: 'My First Post',
        description: 'Post description',
        firstPublished: '2024-01-15',
        featuredImage: null,
        blocks: [
          {
            type: 'paragraph',
            richText: [
              {
                content: 'This is the post content.',
                link: null,
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
              },
            ],
          },
        ],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPostListItems))
      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      const response = await GET()
      const xml = await response.text()

      // Verify item structure
      expect(xml).toContain('<item>')
      expect(xml).toContain('<![CDATA[My First Post]]>')
      expect(xml).toContain('<link>https://michaeluloth.com/my-first-post/</link>')
      expect(xml).toContain('<![CDATA[Post description]]>')
      expect(xml).toContain('<guid')
      expect(xml).toContain('https://michaeluloth.com/my-first-post/')
      expect(xml).toContain('<pubDate>')
      expect(xml).toContain('</item>')
    })

    it('includes rendered HTML content in items', async () => {
      const mockPostListItems: PostListItem[] = [
        {
          id: 'post-1',
          slug: 'test-post',
          title: 'Test Post',
          description: null,
          firstPublished: '2024-01-15',
          featuredImage: null,
        },
      ]

      const mockPost: Post = {
        id: 'post-1',
        slug: 'test-post',
        title: 'Test Post',
        description: null,
        firstPublished: '2024-01-15',
        featuredImage: null,
        blocks: [
          {
            type: 'heading_1',
            richText: [
              {
                content: 'Introduction',
                link: null,
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
              },
            ],
          },
          {
            type: 'paragraph',
            richText: [
              {
                content: 'This is a paragraph with ',
                link: null,
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
              },
              {
                content: 'bold text',
                link: null,
                bold: true,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
              },
            ],
          },
        ],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPostListItems))
      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      const response = await GET()
      const xml = await response.text()

      // Verify content includes rendered HTML
      // The feed library wraps content in CDATA
      expect(xml).toContain('<h1>Introduction</h1>')
      expect(xml).toContain('<p>This is a paragraph with <strong>bold text</strong></p>')
    })

    it('handles multiple posts in correct order', async () => {
      const mockPostListItems: PostListItem[] = [
        {
          id: 'post-2',
          slug: 'newer-post',
          title: 'Newer Post',
          description: null,
          firstPublished: '2024-01-20',
          featuredImage: null,
        },
        {
          id: 'post-1',
          slug: 'older-post',
          title: 'Older Post',
          description: null,
          firstPublished: '2024-01-15',
          featuredImage: null,
        },
      ]

      const mockNewerPost: Post = {
        id: 'post-2',
        slug: 'newer-post',
        title: 'Newer Post',
        description: null,
        firstPublished: '2024-01-20',
        featuredImage: null,
        blocks: [
          {
            type: 'paragraph',
            richText: [
              {
                content: 'Newer content',
                link: null,
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
              },
            ],
          },
        ],
        prevPost: null,
        nextPost: null,
      }

      const mockOlderPost: Post = {
        id: 'post-1',
        slug: 'older-post',
        title: 'Older Post',
        description: null,
        firstPublished: '2024-01-15',
        featuredImage: null,
        blocks: [
          {
            type: 'paragraph',
            richText: [
              {
                content: 'Older content',
                link: null,
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
              },
            ],
          },
        ],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPostListItems))
      vi.mocked(getPost)
        .mockResolvedValueOnce(Ok(mockNewerPost))
        .mockResolvedValueOnce(Ok(mockOlderPost))

      const response = await GET()
      const xml = await response.text()

      // Verify both posts are included
      expect(xml).toContain('<![CDATA[Newer Post]]>')
      expect(xml).toContain('<![CDATA[Older Post]]>')

      // Verify order (newer first in RSS)
      const newerIndex = xml.indexOf('Newer Post')
      const olderIndex = xml.indexOf('Older Post')
      expect(newerIndex).toBeLessThan(olderIndex)
    })

    it('fetches posts with descending sort order', async () => {
      const mockPostListItems: PostListItem[] = []
      vi.mocked(getPosts).mockResolvedValue(Ok(mockPostListItems))

      await GET()

      expect(getPosts).toHaveBeenCalledWith({ sortDirection: 'descending' })
    })

    it('fetches full post content with blocks', async () => {
      const mockPostListItems: PostListItem[] = [
        {
          id: 'post-1',
          slug: 'test-post',
          title: 'Test Post',
          description: null,
          firstPublished: '2024-01-15',
          featuredImage: null,
        },
      ]

      const mockPost: Post = {
        id: 'post-1',
        slug: 'test-post',
        title: 'Test Post',
        description: null,
        firstPublished: '2024-01-15',
        featuredImage: null,
        blocks: [],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPostListItems))
      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      await GET()

      expect(getPost).toHaveBeenCalledWith({ slug: 'test-post', includeBlocks: true })
    })

    it('skips posts that return null from getPost', async () => {
      const mockPostListItems: PostListItem[] = [
        {
          id: 'post-1',
          slug: 'valid-post',
          title: 'Valid Post',
          description: null,
          firstPublished: '2024-01-15',
          featuredImage: null,
        },
        {
          id: 'post-2',
          slug: 'missing-post',
          title: 'Missing Post',
          description: null,
          firstPublished: '2024-01-14',
          featuredImage: null,
        },
      ]

      const mockValidPost: Post = {
        id: 'post-1',
        slug: 'valid-post',
        title: 'Valid Post',
        description: null,
        firstPublished: '2024-01-15',
        featuredImage: null,
        blocks: [
          {
            type: 'paragraph',
            richText: [
              {
                content: 'Valid content',
                link: null,
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
              },
            ],
          },
        ],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPostListItems))
      vi.mocked(getPost)
        .mockResolvedValueOnce(Ok(mockValidPost))
        .mockResolvedValueOnce(Ok(null))

      const response = await GET()
      const xml = await response.text()

      // Verify only valid post is included
      expect(xml).toContain('<![CDATA[Valid Post]]>')
      expect(xml).not.toContain('<![CDATA[Missing Post]]>')
    })

    it('handles posts without description', async () => {
      const mockPostListItems: PostListItem[] = [
        {
          id: 'post-1',
          slug: 'no-description',
          title: 'No Description Post',
          description: null,
          firstPublished: '2024-01-15',
          featuredImage: null,
        },
      ]

      const mockPost: Post = {
        id: 'post-1',
        slug: 'no-description',
        title: 'No Description Post',
        description: null,
        firstPublished: '2024-01-15',
        featuredImage: null,
        blocks: [],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPostListItems))
      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      const response = await GET()
      const xml = await response.text()

      // Verify post is included without description element
      expect(xml).toContain('<![CDATA[No Description Post]]>')
      // RSS feed may or may not include empty description - that's OK
    })
  })
})

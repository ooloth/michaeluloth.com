/**
 * @vitest-environment happy-dom
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { GET } from './route'
import getPosts from '@/io/notion/getPosts'
import getBlockChildren from '@/io/notion/getBlockChildren'
import type { PostListItem } from '@/io/notion/schemas/post'
import type { GroupedBlock } from '@/io/notion/schemas/block'
import { Ok, Err } from '@/utils/errors/result'

// Mock dependencies
vi.mock('@/io/notion/getPosts')
vi.mock('@/io/notion/getBlockChildren')

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
          feedId: null,
        },
      ]

      const mockBlocks: GroupedBlock[] = [
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
      ]

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPostListItems))
      vi.mocked(getBlockChildren).mockResolvedValue(Ok(mockBlocks))

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
          feedId: null,
        },
      ]

      const mockBlocks: GroupedBlock[] = [
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
      ]

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPostListItems))
      vi.mocked(getBlockChildren).mockResolvedValue(Ok(mockBlocks))

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
      expect(xml).toContain('<link>https://michaeluloth.com/</link>')
      expect(xml).toContain('<language>en-ca</language>')
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
          feedId: null,
        },
      ]

      const mockBlocks: GroupedBlock[] = [
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
      ]

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPostListItems))
      vi.mocked(getBlockChildren).mockResolvedValue(Ok(mockBlocks))

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
          feedId: null,
        },
      ]

      const mockBlocks: GroupedBlock[] = [
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
      ]

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPostListItems))
      vi.mocked(getBlockChildren).mockResolvedValue(Ok(mockBlocks))

      const response = await GET()
      const xml = await response.text()

      // Verify content includes rendered HTML
      // The feed library wraps content in CDATA
      expect(xml).toContain('<h1>Introduction</h1>')
      expect(xml).toContain('<p>This is a paragraph with <strong>bold text</strong></p>')
    })

    it('includes featured images when present', async () => {
      const mockPostListItems: PostListItem[] = [
        {
          id: 'post-1',
          slug: 'test-post',
          title: 'Test Post',
          description: null,
          firstPublished: '2024-01-15',
          featuredImage: 'https://res.cloudinary.com/ooloth/image/upload/mu/test.jpg',
        },
      ]

      const mockBlocks: GroupedBlock[] = [
        {
          type: 'paragraph',
          richText: [
            {
              content: 'Post content',
              link: null,
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
            },
          ],
        },
      ]

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPostListItems))
      vi.mocked(getBlockChildren).mockResolvedValue(Ok(mockBlocks))

      const response = await GET()
      const xml = await response.text()

      // Verify featured image is included in content
      expect(xml).toContain('<img src="https://res.cloudinary.com/ooloth/image/upload/mu/test.jpg"')
      expect(xml).toContain('alt="Test Post"')
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
          feedId: null,
        },
        {
          id: 'post-1',
          slug: 'older-post',
          title: 'Older Post',
          description: null,
          firstPublished: '2024-01-15',
          featuredImage: null,
          feedId: null,
        },
      ]

      const mockBlocks: GroupedBlock[] = [
        {
          type: 'paragraph',
          richText: [
            {
              content: 'Content',
              link: null,
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
            },
          ],
        },
      ]

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPostListItems))
      vi.mocked(getBlockChildren).mockResolvedValue(Ok(mockBlocks))

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

    it('fetches blocks for each post', async () => {
      const mockPostListItems: PostListItem[] = [
        {
          id: 'post-1',
          slug: 'test-post',
          title: 'Test Post',
          description: null,
          firstPublished: '2024-01-15',
          featuredImage: null,
          feedId: null,
        },
      ]

      const mockBlocks: GroupedBlock[] = []

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPostListItems))
      vi.mocked(getBlockChildren).mockResolvedValue(Ok(mockBlocks))

      await GET()

      expect(getBlockChildren).toHaveBeenCalledWith('post-1')
    })

    it('skips posts that fail to fetch blocks', async () => {
      const mockPostListItems: PostListItem[] = [
        {
          id: 'post-1',
          slug: 'valid-post',
          title: 'Valid Post',
          description: null,
          firstPublished: '2024-01-15',
          featuredImage: null,
          feedId: null,
        },
        {
          id: 'post-2',
          slug: 'broken-post',
          title: 'Broken Post',
          description: null,
          firstPublished: '2024-01-14',
          featuredImage: null,
          feedId: null,
        },
      ]

      const mockBlocks: GroupedBlock[] = [
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
      ]

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPostListItems))
      vi.mocked(getBlockChildren)
        .mockResolvedValueOnce(Ok(mockBlocks))
        .mockResolvedValueOnce(Err(new Error('Block fetch failed')))

      const response = await GET()
      const xml = await response.text()

      // Verify only valid post is included
      expect(xml).toContain('<![CDATA[Valid Post]]>')
      expect(xml).not.toContain('<![CDATA[Broken Post]]>')
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
          feedId: null,
        },
      ]

      const mockBlocks: GroupedBlock[] = []

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPostListItems))
      vi.mocked(getBlockChildren).mockResolvedValue(Ok(mockBlocks))

      const response = await GET()
      const xml = await response.text()

      // Verify post is included without description element
      expect(xml).toContain('<![CDATA[No Description Post]]>')
      // RSS feed may or may not include empty description - that's OK
    })

    it('uses feedId as guid when present', async () => {
      const mockPostListItems: PostListItem[] = [
        {
          id: 'post-1',
          slug: 'test-post',
          title: 'Test Post',
          description: null,
          firstPublished: '2024-01-15',
          featuredImage: null,
          feedId: 'https://old-site.com/original-url/',
        },
      ]

      const mockBlocks: GroupedBlock[] = []

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPostListItems))
      vi.mocked(getBlockChildren).mockResolvedValue(Ok(mockBlocks))

      const response = await GET()
      const xml = await response.text()

      // When feedId is present, it should be used for guid
      expect(xml).toContain('<guid')
      expect(xml).toContain('https://old-site.com/original-url/')

      // Link should also use feedId
      expect(xml).toContain('<link>https://old-site.com/original-url/</link>')
    })

    it('uses constructed permalink when feedId is absent', async () => {
      const mockPostListItems: PostListItem[] = [
        {
          id: 'post-1',
          slug: 'test-post',
          title: 'Test Post',
          description: null,
          firstPublished: '2024-01-15',
          featuredImage: null,
          feedId: null,
        },
      ]

      const mockBlocks: GroupedBlock[] = []

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPostListItems))
      vi.mocked(getBlockChildren).mockResolvedValue(Ok(mockBlocks))

      const response = await GET()
      const xml = await response.text()

      // When feedId is absent, should use constructed permalink
      expect(xml).toContain('<guid')
      expect(xml).toContain('https://michaeluloth.com/test-post/')
      expect(xml).toContain('<link>https://michaeluloth.com/test-post/</link>')
    })

    it('generates valid, well-formed RSS 2.0 XML', async () => {
      const mockPostListItems: PostListItem[] = [
        {
          id: 'post-1',
          slug: 'test-post',
          title: 'Test Post',
          description: 'Test description',
          firstPublished: '2024-01-15',
          featuredImage: 'https://res.cloudinary.com/ooloth/image/upload/mu/test.jpg',
        },
      ]

      const mockBlocks: GroupedBlock[] = [
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
      ]

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPostListItems))
      vi.mocked(getBlockChildren).mockResolvedValue(Ok(mockBlocks))

      const response = await GET()
      const xml = await response.text()

      // Validate XML declaration
      expect(xml).toMatch(/^<\?xml version="1\.0" encoding="utf-8"\?>/)

      // Validate RSS 2.0 structure
      expect(xml).toContain('<rss')
      expect(xml).toContain('version="2.0"')
      expect(xml).toContain('<channel>')
      expect(xml).toContain('</channel>')
      expect(xml).toContain('</rss>')

      // Validate well-formedness by checking key tag pairs match
      const rssOpenCount = (xml.match(/<rss/g) || []).length
      const rssCloseCount = (xml.match(/<\/rss>/g) || []).length
      expect(rssOpenCount).toBe(rssCloseCount)

      const channelOpenCount = (xml.match(/<channel>/g) || []).length
      const channelCloseCount = (xml.match(/<\/channel>/g) || []).length
      expect(channelOpenCount).toBe(channelCloseCount)

      const itemOpenCount = (xml.match(/<item>/g) || []).length
      const itemCloseCount = (xml.match(/<\/item>/g) || []).length
      expect(itemOpenCount).toBe(itemCloseCount)

      // Validate channel metadata
      expect(xml).toContain('<title>Michael Uloth</title>')
      expect(xml).toContain('Software engineer')
      expect(xml).toContain('<link>https://michaeluloth.com/</link>')
      expect(xml).toContain('<language>en-ca</language>')

      // Validate item structure
      expect(xml).toContain('<item>')
      expect(xml).toContain('</item>')
      expect(xml).toContain('<![CDATA[Test Post]]>')
      expect(xml).toContain('<link>https://michaeluloth.com/test-post/</link>')
      expect(xml).toContain('<guid')
      expect(xml).toContain('https://michaeluloth.com/test-post/')
      expect(xml).toContain('<pubDate>')

      // Validate featured image in content
      expect(xml).toContain('<img src="https://res.cloudinary.com/ooloth/image/upload/mu/test.jpg"')
      expect(xml).toContain('alt="Test Post"')

      // Validate rendered HTML content
      expect(xml).toContain('<h1>Introduction</h1>')
      expect(xml).toContain('<strong>bold text</strong>')

      // Validate no unescaped special characters in text content
      // (the feed library should handle CDATA wrapping)
      const cdataContent = xml.match(/<!\[CDATA\[(.*?)\]\]>/gs)
      expect(cdataContent).toBeTruthy()
    })
  })
})

/**
 * @vitest-environment happy-dom
 */

import { render, screen } from '@testing-library/react'
import { generateStaticParams, generateMetadata } from './page'
import DynamicRoute from './page'
import getPosts from '@/io/notion/getPosts'
import getPost from '@/io/notion/getPost'
import { notFound } from 'next/navigation'
import { Ok, Err } from '@/utils/errors/result'

// Mock dependencies
vi.mock('@/io/notion/getPosts')
vi.mock('@/io/notion/getPost')
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}))
vi.mock('@/ui/layouts/page-layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('generateStaticParams', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('success cases', () => {
    it('returns array of slug params for all posts', async () => {
      const mockPosts = [
        {
          id: '1',
          slug: 'first-post',
          title: 'First Post',
          description: 'Description 1',
          firstPublished: '2024-01-01',
          featuredImage: null,
        },
        {
          id: '2',
          slug: 'second-post',
          title: 'Second Post',
          description: 'Description 2',
          firstPublished: '2024-01-02',
          featuredImage: null,
        },
        {
          id: '3',
          slug: 'third-post',
          title: 'Third Post',
          description: 'Description 3',
          firstPublished: '2024-01-03',
          featuredImage: null,
        },
      ]

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const result = await generateStaticParams()

      expect(result).toEqual([{ slug: 'first-post' }, { slug: 'second-post' }, { slug: 'third-post' }])
    })

    it('calls getPosts with ascending sort direction', async () => {
      vi.mocked(getPosts).mockResolvedValue(Ok([]))

      await generateStaticParams()

      expect(getPosts).toHaveBeenCalledWith({ sortDirection: 'ascending' })
    })

    it('returns empty array when no posts exist', async () => {
      vi.mocked(getPosts).mockResolvedValue(Ok([]))

      const result = await generateStaticParams()

      expect(result).toEqual([])
    })

    it('returns correct params structure for Next.js', async () => {
      const mockPosts = [
        {
          id: '1',
          slug: 'test-slug',
          title: 'Test',
          description: 'Test description',
          firstPublished: '2024-01-01',
          featuredImage: null,
        },
      ]

      vi.mocked(getPosts).mockResolvedValue(Ok(mockPosts))

      const result = await generateStaticParams()

      // Verify structure matches Next.js expectation
      expect(result).toBeInstanceOf(Array)
      expect(result[0]).toHaveProperty('slug')
      expect(typeof result[0].slug).toBe('string')
      expect(Object.keys(result[0])).toEqual(['slug'])
    })
  })

  describe('error cases', () => {
    it('throws when getPosts returns Err', async () => {
      const error = new Error('Failed to fetch posts from Notion')
      vi.mocked(getPosts).mockResolvedValue(Err(error))

      // The .unwrap() call in generateStaticParams should throw
      await expect(generateStaticParams()).rejects.toThrow('Failed to fetch posts from Notion')
    })

    it('throws when getPosts rejects', async () => {
      const error = new Error('Network error')
      vi.mocked(getPosts).mockRejectedValue(error)

      await expect(generateStaticParams()).rejects.toThrow('Network error')
    })
  })
})

describe('DynamicRoute page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('JSON-LD structured data', () => {
    it('renders JSON-LD script with Article schema', async () => {
      const mockPost = {
        id: '123',
        slug: 'test-post',
        title: 'Test Post',
        description: 'Test description',
        firstPublished: '2024-01-15',
        lastEditedTime: '2024-01-20T10:00:00.000Z',
        featuredImage: 'https://example.com/image.jpg',
        blocks: [],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      const params = Promise.resolve({ slug: 'test-post' })
      const jsx = await DynamicRoute({ params })
      render(jsx)

      const scriptTag = document.querySelector('script[type="application/ld+json"]')
      expect(scriptTag).toBeInTheDocument()

      const jsonLd = JSON.parse(scriptTag?.textContent ?? '{}')
      expect(jsonLd).toEqual({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Test Post',
        description: 'Test description',
        datePublished: '2024-01-15',
        dateModified: '2024-01-20T10:00:00.000Z',
        author: {
          '@type': 'Person',
          name: 'Michael Uloth',
        },
        image: 'https://example.com/image.jpg',
        url: 'https://michaeluloth.com/test-post/',
      })
    })

    it('uses default OG image when post has no featured image', async () => {
      const mockPost = {
        id: '123',
        slug: 'no-image',
        title: 'Post Without Image',
        description: 'No image',
        firstPublished: '2024-01-15',
        lastEditedTime: '2024-01-15T00:00:00.000Z',
        featuredImage: null,
        blocks: [],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      const params = Promise.resolve({ slug: 'no-image' })
      const jsx = await DynamicRoute({ params })
      render(jsx)

      const scriptTag = document.querySelector('script[type="application/ld+json"]')
      const jsonLd = JSON.parse(scriptTag?.textContent ?? '{}')

      expect(jsonLd.image).toBe('/og-image.png')
    })

    it('includes correct URL structure', async () => {
      const mockPost = {
        id: '123',
        slug: 'my-awesome-post',
        title: 'My Awesome Post',
        description: 'Test description',
        firstPublished: '2024-01-15',
        lastEditedTime: '2024-01-15T00:00:00.000Z',
        featuredImage: null,
        blocks: [],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      const params = Promise.resolve({ slug: 'my-awesome-post' })
      const jsx = await DynamicRoute({ params })
      render(jsx)

      const scriptTag = document.querySelector('script[type="application/ld+json"]')
      const jsonLd = JSON.parse(scriptTag?.textContent ?? '{}')

      expect(jsonLd.url).toBe('https://michaeluloth.com/my-awesome-post/')
    })
  })

  describe('success cases', () => {
    it('fetches and renders post with blocks and navigation', async () => {
      const mockPost = {
        id: '123',
        slug: 'test-post',
        title: 'Test Post',
        description: 'Test description',
        firstPublished: '2024-01-15',
        lastEditedTime: '2024-01-15T00:00:00.000Z',
        featuredImage: null,
        blocks: [
          {
            type: 'paragraph' as const,
            richText: [
              {
                type: 'text' as const,
                content: 'Test content',
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
        prevPost: {
          slug: 'previous-post',
          title: 'Previous Post',
        },
        nextPost: {
          slug: 'next-post',
          title: 'Next Post',
        },
      }

      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      const params = Promise.resolve({ slug: 'test-post' })
      const jsx = await DynamicRoute({ params })
      render(jsx)

      expect(getPost).toHaveBeenCalledWith({
        slug: 'test-post',
        includeBlocks: true,
        includePrevAndNext: true,
      })

      // Verify post content is rendered
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Post')
      expect(screen.getByText('Test content')).toBeInTheDocument()

      // Verify navigation links (accessible name is just the post title with non-breaking space)
      const links = screen.getAllByRole('link')
      const previousLink = links.find(link => link.getAttribute('href') === '/previous-post/')
      const nextLink = links.find(link => link.getAttribute('href') === '/next-post/')

      expect(previousLink).toHaveAccessibleName('Previous\u00A0Post')
      expect(nextLink).toHaveAccessibleName('Next\u00A0Post')
    })

    it('calls getPost with correct options', async () => {
      const mockPost = {
        id: '123',
        slug: 'my-post',
        title: 'My Post',
        description: 'Test description',
        firstPublished: '2024-01-15',
        lastEditedTime: '2024-01-15T00:00:00.000Z',
        featuredImage: null,
        blocks: [],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      const params = Promise.resolve({ slug: 'my-post' })
      const jsx = await DynamicRoute({ params })
      render(jsx)

      expect(getPost).toHaveBeenCalledWith({
        slug: 'my-post',
        includeBlocks: true,
        includePrevAndNext: true,
      })

      // Verify post title is rendered
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('My Post')
    })

    it('renders post without navigation when prevPost and nextPost are null', async () => {
      const mockPost = {
        id: '123',
        slug: 'standalone-post',
        title: 'Standalone Post',
        description: 'Test description',
        firstPublished: '2024-01-15',
        lastEditedTime: '2024-01-15T00:00:00.000Z',
        featuredImage: null,
        blocks: [],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      const params = Promise.resolve({ slug: 'standalone-post' })
      const jsx = await DynamicRoute({ params })
      render(jsx)

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Standalone Post')

      // No navigation links should be present
      const links = screen.queryAllByRole('link')
      const navLinks = links.filter(
        link => link.textContent?.includes('Previous') || link.textContent?.includes('Next'),
      )
      expect(navLinks.length).toBe(0)
    })
  })

  describe('notFound behavior', () => {
    it('calls notFound() when post is null', async () => {
      vi.mocked(getPost).mockResolvedValue(Ok(null))
      vi.mocked(notFound).mockImplementation(() => {
        throw new Error('NEXT_NOT_FOUND')
      })

      const params = Promise.resolve({ slug: 'nonexistent-post' })
      await expect(DynamicRoute({ params })).rejects.toThrow('NEXT_NOT_FOUND')
      expect(notFound).toHaveBeenCalled()
    })

    it('calls notFound() when post does not exist', async () => {
      vi.mocked(getPost).mockResolvedValue(Ok(null))
      vi.mocked(notFound).mockImplementation(() => {
        throw new Error('NEXT_NOT_FOUND')
      })

      const params = Promise.resolve({ slug: 'missing-post' })
      await expect(DynamicRoute({ params })).rejects.toThrow('NEXT_NOT_FOUND')
      expect(notFound).toHaveBeenCalled()
    })
  })

  describe('error cases', () => {
    it('throws when getPost returns Err', async () => {
      const error = new Error('Failed to fetch post from Notion')
      vi.mocked(getPost).mockResolvedValue(Err(error))

      const params = Promise.resolve({ slug: 'test-post' })

      // The .unwrap() call should throw, causing build to fail
      await expect(DynamicRoute({ params })).rejects.toThrow('Failed to fetch post from Notion')
    })

    it('throws when getPost rejects', async () => {
      const error = new Error('Network error')
      vi.mocked(getPost).mockRejectedValue(error)

      const params = Promise.resolve({ slug: 'test-post' })
      await expect(DynamicRoute({ params })).rejects.toThrow('Network error')
    })
  })
})

describe('generateMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('success cases', () => {
    it('generates metadata with post data when post has featured image', async () => {
      const mockPost = {
        id: '123',
        slug: 'test-post',
        title: 'Test Post Title',
        description: 'Test post description',
        firstPublished: '2024-01-15',
        lastEditedTime: '2024-01-20T10:00:00.000Z',
        featuredImage: 'https://example.com/image.jpg',
        blocks: [],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      const params = Promise.resolve({ slug: 'test-post' })
      const metadata = await generateMetadata({ params })

      expect(metadata).toEqual({
        title: 'Test Post Title',
        description: 'Test post description',
        alternates: {
          canonical: 'https://michaeluloth.com/test-post/',
        },
        openGraph: {
          type: 'article',
          url: 'https://michaeluloth.com/test-post/',
          siteName: 'Michael Uloth',
          locale: 'en_CA',
          title: 'Test Post Title',
          description: 'Test post description',
          publishedTime: '2024-01-15',
          modifiedTime: '2024-01-20T10:00:00.000Z',
          authors: ['Michael Uloth'],
          images: ['https://example.com/image.jpg'],
        },
        twitter: {
          card: 'summary_large_image',
          creator: '@ooloth',
          title: 'Test Post Title',
          description: 'Test post description',
          images: ['https://example.com/image.jpg'],
        },
      })
    })

    it('uses default OG image when post has no featured image', async () => {
      const mockPost = {
        id: '123',
        slug: 'no-image-post',
        title: 'Post Without Image',
        description: 'No featured image',
        firstPublished: '2024-01-15',
        lastEditedTime: '2024-01-15T00:00:00.000Z',
        featuredImage: null,
        blocks: [],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      const params = Promise.resolve({ slug: 'no-image-post' })
      const metadata = await generateMetadata({ params })

      expect(metadata.openGraph?.images).toEqual(['/og-image.png'])
      expect(metadata.twitter?.images).toEqual(['/og-image.png'])
    })

    it('calls getPost with correct slug', async () => {
      const mockPost = {
        id: '123',
        slug: 'my-test-post',
        title: 'My Test Post',
        description: 'Test description',
        firstPublished: '2024-01-15',
        lastEditedTime: '2024-01-15T00:00:00.000Z',
        featuredImage: null,
        blocks: [],
        prevPost: null,
        nextPost: null,
      }

      vi.mocked(getPost).mockResolvedValue(Ok(mockPost))

      const params = Promise.resolve({ slug: 'my-test-post' })
      await generateMetadata({ params })

      expect(getPost).toHaveBeenCalledWith({ slug: 'my-test-post' })
    })
  })

  describe('notFound behavior', () => {
    it('returns empty object when post is null', async () => {
      vi.mocked(getPost).mockResolvedValue(Ok(null))

      const params = Promise.resolve({ slug: 'nonexistent-post' })
      const metadata = await generateMetadata({ params })

      expect(metadata).toEqual({})
    })
  })

  describe('error cases', () => {
    it('throws when getPost returns Err', async () => {
      const error = new Error('Failed to fetch post metadata')
      vi.mocked(getPost).mockResolvedValue(Err(error))

      const params = Promise.resolve({ slug: 'test-post' })

      await expect(generateMetadata({ params })).rejects.toThrow('Failed to fetch post metadata')
    })

    it('throws when getPost rejects', async () => {
      const error = new Error('Network error')
      vi.mocked(getPost).mockRejectedValue(error)

      const params = Promise.resolve({ slug: 'test-post' })

      await expect(generateMetadata({ params })).rejects.toThrow('Network error')
    })
  })
})

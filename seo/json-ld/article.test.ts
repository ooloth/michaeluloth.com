import { describe, it, expect } from 'vitest'
import { generateArticleJsonLd, getPostUrl } from './article'
import type { Post } from '@/io/notion/schemas/post'

describe('getPostUrl', () => {
  it('constructs correct URL with trailing slash', () => {
    expect(getPostUrl('test-post')).toBe('https://michaeluloth.com/test-post/')
  })

  it('handles slugs with hyphens', () => {
    expect(getPostUrl('my-awesome-post')).toBe('https://michaeluloth.com/my-awesome-post/')
  })

  it('handles single-word slugs', () => {
    expect(getPostUrl('hello')).toBe('https://michaeluloth.com/hello/')
  })
})

describe('generateArticleJsonLd', () => {
  it('generates correct JSON-LD structure with all required fields', () => {
    const post: Post = {
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

    const jsonLd = generateArticleJsonLd(post)

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

  it('uses default OG image when post has no featured image', () => {
    const post: Post = {
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

    const jsonLd = generateArticleJsonLd(post)

    expect(jsonLd.image).toBe('/og-image.png')
  })

  it('constructs correct URL from slug', () => {
    const post: Post = {
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

    const jsonLd = generateArticleJsonLd(post)

    expect(jsonLd.url).toBe('https://michaeluloth.com/my-awesome-post/')
  })

  it('includes correct Schema.org context and type', () => {
    const post: Post = {
      id: '123',
      slug: 'test',
      title: 'Test',
      description: 'Test',
      firstPublished: '2024-01-15',
      lastEditedTime: '2024-01-15T00:00:00.000Z',
      featuredImage: null,
      blocks: [],
      prevPost: null,
      nextPost: null,
    }

    const jsonLd = generateArticleJsonLd(post)

    expect(jsonLd['@context']).toBe('https://schema.org')
    expect(jsonLd['@type']).toBe('Article')
  })

  it('includes author as Person type with correct name', () => {
    const post: Post = {
      id: '123',
      slug: 'test',
      title: 'Test',
      description: 'Test',
      firstPublished: '2024-01-15',
      lastEditedTime: '2024-01-15T00:00:00.000Z',
      featuredImage: null,
      blocks: [],
      prevPost: null,
      nextPost: null,
    }

    const jsonLd = generateArticleJsonLd(post)

    expect(jsonLd.author).toEqual({
      '@type': 'Person',
      name: 'Michael Uloth',
    })
  })

  it('uses post title as headline', () => {
    const post: Post = {
      id: '123',
      slug: 'test',
      title: 'My Amazing Blog Post Title',
      description: 'Test',
      firstPublished: '2024-01-15',
      lastEditedTime: '2024-01-15T00:00:00.000Z',
      featuredImage: null,
      blocks: [],
      prevPost: null,
      nextPost: null,
    }

    const jsonLd = generateArticleJsonLd(post)

    expect(jsonLd.headline).toBe('My Amazing Blog Post Title')
  })

  it('uses firstPublished as datePublished', () => {
    const post: Post = {
      id: '123',
      slug: 'test',
      title: 'Test',
      description: 'Test',
      firstPublished: '2024-03-25',
      lastEditedTime: '2024-01-15T00:00:00.000Z',
      featuredImage: null,
      blocks: [],
      prevPost: null,
      nextPost: null,
    }

    const jsonLd = generateArticleJsonLd(post)

    expect(jsonLd.datePublished).toBe('2024-03-25')
  })

  it('uses lastEditedTime as dateModified', () => {
    const post: Post = {
      id: '123',
      slug: 'test',
      title: 'Test',
      description: 'Test',
      firstPublished: '2024-01-15',
      lastEditedTime: '2024-04-30T15:30:00.000Z',
      featuredImage: null,
      blocks: [],
      prevPost: null,
      nextPost: null,
    }

    const jsonLd = generateArticleJsonLd(post)

    expect(jsonLd.dateModified).toBe('2024-04-30T15:30:00.000Z')
  })
})

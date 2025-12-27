import { describe, it, expect } from 'vitest'
import { generateBlogJsonLd } from './blog'

describe('generateBlogJsonLd', () => {
  it('generates correct JSON-LD structure with all required fields', () => {
    const jsonLd = generateBlogJsonLd()

    expect(jsonLd).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: "Michael Uloth's Blog",
      description: 'Articles about software engineering, web development, and building better tools.',
      url: 'https://michaeluloth.com/blog/',
      author: {
        '@type': 'Person',
        name: 'Michael Uloth',
        url: 'https://michaeluloth.com/',
      },
    })
  })

  it('includes correct Schema.org context and type', () => {
    const jsonLd = generateBlogJsonLd()

    expect(jsonLd['@context']).toBe('https://schema.org')
    expect(jsonLd['@type']).toBe('Blog')
  })

  it('includes blog name', () => {
    const jsonLd = generateBlogJsonLd()

    expect(jsonLd.name).toBe("Michael Uloth's Blog")
  })

  it('includes blog description', () => {
    const jsonLd = generateBlogJsonLd()

    expect(jsonLd.description).toBe('Articles about software engineering, web development, and building better tools.')
  })

  it('includes blog URL with trailing slash', () => {
    const jsonLd = generateBlogJsonLd()

    expect(jsonLd.url).toBe('https://michaeluloth.com/blog/')
  })

  it('includes author as Person type', () => {
    const jsonLd = generateBlogJsonLd()

    expect(jsonLd.author['@type']).toBe('Person')
  })

  it('includes author name', () => {
    const jsonLd = generateBlogJsonLd()

    expect(jsonLd.author.name).toBe('Michael Uloth')
  })

  it('includes author URL', () => {
    const jsonLd = generateBlogJsonLd()

    expect(jsonLd.author.url).toBe('https://michaeluloth.com/')
  })
})

import { describe, it, expect } from 'vitest'
import { extractSearchableAttrs, extractFailingAudits, formatPageFailures } from './parse-errors'

describe('extractSearchableAttrs', () => {
  it('extracts href attribute', () => {
    const snippet = '<a href="/rss.xml">RSS Feed</a>'
    expect(extractSearchableAttrs(snippet)).toEqual(['href="/rss.xml"'])
  })

  it('extracts src attribute', () => {
    const snippet = '<img src="/logo.png">'
    expect(extractSearchableAttrs(snippet)).toEqual(['src="/logo.png"'])
  })

  it('extracts alt attribute', () => {
    const snippet = '<img alt="Company logo">'
    expect(extractSearchableAttrs(snippet)).toEqual(['alt="Company logo"'])
  })

  it('extracts aria-label attribute', () => {
    const snippet = '<button aria-label="Close dialog">×</button>'
    expect(extractSearchableAttrs(snippet)).toEqual(['aria-label="Close dialog"'])
  })

  it('extracts id attribute', () => {
    const snippet = '<div id="main-content"></div>'
    expect(extractSearchableAttrs(snippet)).toEqual(['id="main-content"'])
  })

  it('extracts data-testid attribute', () => {
    const snippet = '<button data-testid="submit-button">Submit</button>'
    expect(extractSearchableAttrs(snippet)).toEqual(['data-testid="submit-button"'])
  })

  it('extracts multiple attributes from same element', () => {
    const snippet = '<img src="/logo.png" alt="Company logo">'
    expect(extractSearchableAttrs(snippet)).toEqual(['src="/logo.png"', 'alt="Company logo"'])
  })

  it('extracts first occurrence when attribute appears multiple times', () => {
    const snippet = '<a href="/first">Link</a> <a href="/second">Link</a>'
    // Regex only matches first occurrence
    expect(extractSearchableAttrs(snippet)).toEqual(['href="/first"'])
  })

  it('returns empty array when no recognized attributes found', () => {
    const snippet = '<div class="container"></div>'
    expect(extractSearchableAttrs(snippet)).toEqual([])
  })

  it('handles empty string', () => {
    expect(extractSearchableAttrs('')).toEqual([])
  })

  it('handles malformed HTML gracefully', () => {
    const snippet = '<a href="/link'
    // Missing closing quote - regex won't match
    expect(extractSearchableAttrs(snippet)).toEqual([])
  })

  it('extracts attributes with special characters in values', () => {
    const snippet = '<a href="/blog/post-title-with-dashes">Post</a>'
    expect(extractSearchableAttrs(snippet)).toEqual(['href="/blog/post-title-with-dashes"'])
  })

  it('extracts attributes with query parameters', () => {
    const snippet = '<a href="/search?q=test&sort=date">Search</a>'
    expect(extractSearchableAttrs(snippet)).toEqual(['href="/search?q=test&sort=date"'])
  })

  it('extracts attributes with anchor fragments', () => {
    const snippet = '<a href="/docs#installation">Docs</a>'
    expect(extractSearchableAttrs(snippet)).toEqual(['href="/docs#installation"'])
  })

  it('handles absolute URLs', () => {
    const snippet = '<a href="https://example.com/page">External</a>'
    expect(extractSearchableAttrs(snippet)).toEqual(['href="https://example.com/page"'])
  })

  it('handles data URLs for images', () => {
    const snippet = '<img src="data:image/png;base64,iVBORw0KG">'
    expect(extractSearchableAttrs(snippet)).toEqual(['src="data:image/png;base64,iVBORw0KG"'])
  })
})

describe('extractFailingAudits', () => {
  it('returns only audits with score < 1', () => {
    const mockLhr = {
      finalUrl: 'http://localhost/index.html',
      audits: {
        'image-alt': {
          id: 'image-alt',
          title: 'Image elements have alt attributes',
          score: 0.5,
          description: 'Images must have alt text',
        },
        'document-title': {
          id: 'document-title',
          title: 'Document has a title',
          score: 1,
          description: 'The title gives screen readers...',
        },
        'html-has-lang': {
          id: 'html-has-lang',
          title: 'HTML has lang attribute',
          score: 0,
          description: 'The lang attribute...',
        },
      },
      categories: {
        accessibility: { score: 0.89 },
        performance: { score: 0.95 },
        seo: { score: 1.0 },
        'best-practices': { score: 1.0 },
      },
    }

    const result = extractFailingAudits(mockLhr)

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('image-alt')
    expect(result[0].score).toBe(0.5)
    expect(result[1].id).toBe('html-has-lang')
    expect(result[1].score).toBe(0)
  })

  it('extracts element details with searchable attributes', () => {
    const mockLhr = {
      finalUrl: 'http://localhost/page.html',
      audits: {
        'image-alt': {
          id: 'image-alt',
          title: 'Image elements have alt attributes',
          score: 0.5,
          description: 'Images must have alt text',
          details: {
            items: [
              {
                node: {
                  selector: 'img.logo',
                  snippet: '<img src="/logo.png">',
                },
              },
            ],
          },
        },
      },
      categories: {
        accessibility: { score: 0.89 },
        performance: { score: 0.95 },
        seo: { score: 1.0 },
        'best-practices': { score: 1.0 },
      },
    }

    const result = extractFailingAudits(mockLhr)

    expect(result).toHaveLength(1)
    expect(result[0].elements).toHaveLength(1)
    expect(result[0].elements[0].selector).toBe('img.logo')
    expect(result[0].elements[0].snippet).toBe('<img src="/logo.png">')
    expect(result[0].elements[0].searchableAttrs).toEqual(['src="/logo.png"'])
  })

  it('handles audits without details', () => {
    const mockLhr = {
      finalUrl: 'http://localhost/page.html',
      audits: {
        'meta-description': {
          id: 'meta-description',
          title: 'Document has meta description',
          score: 0,
          description: 'Meta descriptions...',
          // No details property
        },
      },
      categories: {
        accessibility: { score: 0.89 },
        performance: { score: 0.95 },
        seo: { score: 1.0 },
        'best-practices': { score: 1.0 },
      },
    }

    const result = extractFailingAudits(mockLhr)

    expect(result).toHaveLength(1)
    expect(result[0].elements).toEqual([])
  })

  it('handles audits with null score', () => {
    const mockLhr = {
      finalUrl: 'http://localhost/page.html',
      audits: {
        'not-applicable': {
          id: 'not-applicable',
          title: 'Some audit',
          score: null,
          description: 'Description',
        },
      },
      categories: {
        accessibility: { score: 0.89 },
        performance: { score: 0.95 },
        seo: { score: 1.0 },
        'best-practices': { score: 1.0 },
      },
    }

    const result = extractFailingAudits(mockLhr)

    expect(result).toHaveLength(0)
  })
})

describe('formatPageFailures', () => {
  it('includes URL and category scores', () => {
    const mockFailures = {
      url: 'http://localhost:3000/index.html',
      categories: {
        accessibility: { score: 0.89 },
        performance: { score: 0.95 },
        seo: { score: 0.92 },
        'best-practices': { score: 1.0 },
      },
      audits: [],
    }

    const output = formatPageFailures(mockFailures)

    expect(output).toContain('http://localhost:3000/index.html')
    expect(output).toContain('Accessibility: 89%')
    expect(output).toContain('Performance:   95%')
    expect(output).toContain('SEO:           92%')
    expect(output).toContain('Best Practices: 100%')
  })

  it('includes audit titles and scores', () => {
    const mockFailures = {
      url: 'http://localhost:3000/page.html',
      categories: {
        accessibility: { score: 0.89 },
        performance: { score: 0.95 },
        seo: { score: 1.0 },
        'best-practices': { score: 1.0 },
      },
      audits: [
        {
          id: 'image-alt',
          title: 'Image elements have alt attributes',
          score: 0.5,
          description: 'Images must have alt text',
          elements: [],
        },
      ],
    }

    const output = formatPageFailures(mockFailures)

    expect(output).toContain('✗ Image elements have alt attributes (score: 0.5)')
    expect(output).toContain('Images must have alt text')
  })

  it('includes greppable attributes when available', () => {
    const mockFailures = {
      url: 'http://localhost:3000/page.html',
      categories: {
        accessibility: { score: 0.89 },
        performance: { score: 0.95 },
        seo: { score: 1.0 },
        'best-practices': { score: 1.0 },
      },
      audits: [
        {
          id: 'link-name',
          title: 'Links have discernible name',
          score: 0,
          description: 'Link text should be descriptive',
          elements: [
            {
              selector: 'a.nav-link',
              snippet: '<a href="/about">',
              searchableAttrs: ['href="/about"'],
            },
          ],
        },
      ],
    }

    const output = formatPageFailures(mockFailures)

    expect(output).toContain('GREP FOR: href="/about"')
    expect(output).toContain('CSS: a.nav-link')
    expect(output).toContain('HTML: <a href="/about">')
  })

  it('shows failing audit count', () => {
    const mockFailures = {
      url: 'http://localhost:3000/page.html',
      categories: {
        accessibility: { score: 0.89 },
        performance: { score: 0.95 },
        seo: { score: 1.0 },
        'best-practices': { score: 1.0 },
      },
      audits: [
        {
          id: 'audit-1',
          title: 'Audit 1',
          score: 0.5,
          description: 'Description 1',
          elements: [],
        },
        {
          id: 'audit-2',
          title: 'Audit 2',
          score: 0,
          description: 'Description 2',
          elements: [],
        },
      ],
    }

    const output = formatPageFailures(mockFailures)

    expect(output).toContain('Failing audits (2)')
  })
})

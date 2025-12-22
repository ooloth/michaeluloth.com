import { describe, it, expect } from 'vitest'
import { extractSearchableAttrs } from './parse-lighthouse-errors'

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

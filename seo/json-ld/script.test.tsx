/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import JsonLdScript from './script'
import type { Post } from '@/io/notion/schemas/post'

describe('JsonLdScript', () => {
  describe('type="person"', () => {
    it('renders Person schema script tag', () => {
      const { container } = render(<JsonLdScript type="person" />)

      const script = container.querySelector('script')
      expect(script).toBeTruthy()
      expect(script?.type).toBe('application/ld+json')
    })

    it('generates Person schema with correct structure', () => {
      const { container } = render(<JsonLdScript type="person" />)

      const script = container.querySelector('script')
      const content = script?.innerHTML
      expect(content).toContain('"@context":"https://schema.org"')
      expect(content).toContain('"@type":"Person"')
      expect(content).toContain('"name":"Michael Uloth"')
      expect(content).toContain('"jobTitle":"Software Engineer"')
    })

    it('includes social URLs in sameAs array', () => {
      const { container } = render(<JsonLdScript type="person" />)

      const script = container.querySelector('script')
      const content = script?.innerHTML
      expect(content).toContain('"sameAs":[')
      expect(content).toContain('github.com')
      expect(content).toContain('linkedin.com')
    })
  })

  describe('type="blog"', () => {
    it('renders Blog schema script tag', () => {
      const { container } = render(<JsonLdScript type="blog" />)

      const script = container.querySelector('script')
      expect(script).toBeTruthy()
      expect(script?.type).toBe('application/ld+json')
    })

    it('generates Blog schema with correct structure', () => {
      const { container } = render(<JsonLdScript type="blog" />)

      const script = container.querySelector('script')
      const content = script?.innerHTML
      expect(content).toContain('"@context":"https://schema.org"')
      expect(content).toContain('"@type":"Blog"')
      expect(content).toContain('"name":"Michael Uloth\'s Blog"')
    })

    it('includes author as Person', () => {
      const { container } = render(<JsonLdScript type="blog" />)

      const script = container.querySelector('script')
      const content = script?.innerHTML
      expect(content).toContain('"author":{')
      expect(content).toContain('"@type":"Person"')
    })
  })

  describe('type="article"', () => {
    const mockPost: Post = {
      id: '123',
      slug: 'test-post',
      title: 'Test Article',
      description: 'Test article description',
      firstPublished: '2024-01-15',
      lastEditedTime: '2024-01-20T10:00:00.000Z',
      featuredImage: null,
      blocks: [],
      prevPost: null,
      nextPost: null,
    }

    it('renders Article schema script tag', () => {
      const { container } = render(<JsonLdScript type="article" post={mockPost} />)

      const script = container.querySelector('script')
      expect(script).toBeTruthy()
      expect(script?.type).toBe('application/ld+json')
    })

    it('generates Article schema with correct structure', () => {
      const { container } = render(<JsonLdScript type="article" post={mockPost} />)

      const script = container.querySelector('script')
      const content = script?.innerHTML
      expect(content).toContain('"@context":"https://schema.org"')
      expect(content).toContain('"@type":"Article"')
      expect(content).toContain('"headline":"Test Article"')
      expect(content).toContain('"description":"Test article description"')
    })

    it('includes post dates', () => {
      const { container } = render(<JsonLdScript type="article" post={mockPost} />)

      const script = container.querySelector('script')
      const content = script?.innerHTML
      expect(content).toContain('"datePublished":"2024-01-15"')
      expect(content).toContain('"dateModified":"2024-01-20T10:00:00.000Z"')
    })

    it('constructs URL from post slug', () => {
      const { container } = render(<JsonLdScript type="article" post={mockPost} />)

      const script = container.querySelector('script')
      const content = script?.innerHTML
      expect(content).toContain('"url":"https://michaeluloth.com/test-post/"')
    })

    it('includes author as Person', () => {
      const { container } = render(<JsonLdScript type="article" post={mockPost} />)

      const script = container.querySelector('script')
      const content = script?.innerHTML
      expect(content).toContain('"author":{')
      expect(content).toContain('"@type":"Person"')
      expect(content).toContain('"name":"Michael Uloth"')
    })
  })

  describe('XSS prevention', () => {
    it('escapes < characters in Person schema', () => {
      const { container } = render(<JsonLdScript type="person" />)

      const script = container.querySelector('script')
      const content = script?.innerHTML
      // Should not contain unescaped < (except in the opening tag which is fine)
      const contentWithoutTags = content?.replace(/<[^>]*>/g, '')
      expect(contentWithoutTags?.includes('<')).toBe(false)
    })

    it('escapes < characters in Article schema with malicious content', () => {
      const maliciousPost: Post = {
        id: '123',
        slug: 'test-post',
        title: 'Test </script><script>alert("XSS")</script>',
        description: 'Test with <tags>',
        firstPublished: '2024-01-15',
        lastEditedTime: '2024-01-15T00:00:00.000Z',
        featuredImage: null,
        blocks: [],
        prevPost: null,
        nextPost: null,
      }

      const { container } = render(<JsonLdScript type="article" post={maliciousPost} />)

      const script = container.querySelector('script')
      const content = script?.innerHTML
      // The < should be escaped as \u003c
      expect(content).toContain('\\u003c/script>')
      expect(content).toContain('\\u003ctags>')
      // Should NOT contain unescaped </script>
      expect(content).not.toContain('</script><script>')
    })
  })
})

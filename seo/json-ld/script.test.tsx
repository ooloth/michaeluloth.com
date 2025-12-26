/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import JsonLdScript from './script'

describe('JsonLdScript', () => {
  it('renders script tag with correct type', () => {
    const data = { '@context': 'https://schema.org', '@type': 'Person' }
    const { container } = render(<JsonLdScript data={data} />)

    const script = container.querySelector('script')
    expect(script).toBeTruthy()
    expect(script?.type).toBe('application/ld+json')
  })

  it('stringifies JSON data correctly', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Test Name',
    }
    const { container } = render(<JsonLdScript data={data} />)

    const script = container.querySelector('script')
    const content = script?.innerHTML
    expect(content).toContain('"@context":"https://schema.org"')
    expect(content).toContain('"@type":"Person"')
    expect(content).toContain('"name":"Test Name"')
  })

  it('escapes < characters to prevent XSS', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      description: 'Test with </script> tag',
    }
    const { container } = render(<JsonLdScript data={data} />)

    const script = container.querySelector('script')
    const content = script?.innerHTML
    // The < should be escaped as \u003c
    expect(content).toContain('\\u003c/script>')
    // Should NOT contain unescaped </script>
    expect(content).not.toContain('</script>')
  })

  it('handles Person schema structure', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Michael Uloth',
      jobTitle: 'Software Engineer',
      url: 'https://michaeluloth.com',
    }
    const { container } = render(<JsonLdScript data={data} />)

    const script = container.querySelector('script')
    expect(script?.innerHTML).toContain('"jobTitle":"Software Engineer"')
  })

  it('handles Blog schema structure', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'My Blog',
      author: {
        '@type': 'Person',
        name: 'Author Name',
      },
    }
    const { container } = render(<JsonLdScript data={data} />)

    const script = container.querySelector('script')
    const content = script?.innerHTML
    expect(content).toContain('"@type":"Blog"')
    expect(content).toContain('"author":{')
  })

  it('handles Article schema structure', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Test Article',
      datePublished: '2024-01-15',
      author: {
        '@type': 'Person',
        name: 'Author Name',
      },
    }
    const { container } = render(<JsonLdScript data={data} />)

    const script = container.querySelector('script')
    const content = script?.innerHTML
    expect(content).toContain('"headline":"Test Article"')
    expect(content).toContain('"datePublished":"2024-01-15"')
  })

  it('handles arrays in JSON-LD data', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      sameAs: ['https://github.com/user', 'https://twitter.com/user'],
    }
    const { container } = render(<JsonLdScript data={data} />)

    const script = container.querySelector('script')
    const content = script?.innerHTML
    expect(content).toContain('"sameAs":["https://github.com/user","https://twitter.com/user"]')
  })

  it('escapes multiple < characters', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      description: 'Test <tag> and </script> and <div>',
    }
    const { container } = render(<JsonLdScript data={data} />)

    const script = container.querySelector('script')
    const content = script?.innerHTML
    // All < should be escaped
    expect(content).toContain('\\u003ctag>')
    expect(content).toContain('\\u003c/script>')
    expect(content).toContain('\\u003cdiv>')
    // Should NOT contain any unescaped <
    expect(content?.match(/[^\\]</)).toBeNull()
  })
})

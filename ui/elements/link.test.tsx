/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import fc from 'fast-check'
import Link, { classifyHref } from './link'

const siteOrigins = ['https://michaeluloth.com', 'http://michaeluloth.com', 'https://www.michaeluloth.com']
const siteHosts = new Set(['michaeluloth.com', 'www.michaeluloth.com'])

describe('classifyHref', () => {
  describe('normalizes internal paths', () => {
    it.each([
      { href: '/blog', path: '/blog/' },
      { href: '/blog/', path: '/blog/' },
      { href: '/blog/post/', path: '/blog/post/' },
      { href: '//blog//', path: '/blog/' },
      { href: '///blog///', path: '/blog/' },
      { href: '/', path: '/' },
    ])('turns $href into $path', ({ href, path }) => {
      expect(classifyHref(href)).toEqual({ kind: 'internal', path })
    })

    it('keeps the query and hash after the trailing slash', () => {
      expect(classifyHref('/blog?tag=css#top')).toEqual({ kind: 'internal', path: '/blog/?tag=css#top' })
    })
  })

  describe('treats every site origin as internal', () => {
    it.each(siteOrigins.flatMap(origin => [`${origin}/blog`, `${origin}/blog/`]))('turns %s into /blog/', href => {
      expect(classifyHref(href)).toEqual({ kind: 'internal', path: '/blog/' })
    })

    it.each(siteOrigins)('turns the bare origin %s into /', href => {
      expect(classifyHref(href)).toEqual({ kind: 'internal', path: '/' })
    })
  })

  describe('leaves other hrefs untouched', () => {
    it.each([
      'https://github.com/ooloth/michaeluloth.com',
      'https://example.com/?ref=michaeluloth.com',
      'https://michaeluloth.com.example.com/blog',
      'https://notmichaeluloth.com/blog',
      'https://example.com',
      'mailto:hello@example.com',
      '#section',
      'blog',
    ])('keeps %s external and unchanged', href => {
      expect(classifyHref(href)).toEqual({ kind: 'external', href })
    })

    it('keeps any URL on another host external and unchanged', () => {
      fc.assert(
        fc.property(
          fc
            .webUrl({ withQueryParameters: true, withFragments: true })
            .filter(url => !siteHosts.has(new URL(url).hostname)),
          url => {
            expect(classifyHref(url)).toEqual({ kind: 'external', href: url })
          },
        ),
      )
    })
  })

  it('gives any site URL a path that starts and ends with a slash and has no empty segments', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...siteOrigins),
        fc.webPath(),
        fc.option(fc.webQueryParameters(), { nil: undefined }),
        fc.option(fc.webFragments(), { nil: undefined }),
        (origin, path, query, fragment) => {
          const href = `${origin}${path}${query === undefined ? '' : `?${query}`}${fragment === undefined ? '' : `#${fragment}`}`
          const result = classifyHref(href)

          expect(result.kind).toBe('internal')
          const pathOnly = result.kind === 'internal' ? result.path.split(/[?#]/)[0] : ''
          expect(pathOnly.startsWith('/')).toBe(true)
          expect(pathOnly.endsWith('/')).toBe(true)
          expect(pathOnly).not.toContain('//')
        },
      ),
    )
  })
})

describe('Link', () => {
  describe('internal links', () => {
    it('renders internal link with Next.js Link', () => {
      render(<Link href="/about">About</Link>)
      const link = screen.getByRole('link', { name: 'About' })
      expect(link).toBeInTheDocument()
    })

    it('treats paths starting with / as internal', () => {
      render(<Link href="/contact">Contact</Link>)
      const link = screen.getByRole('link', { name: 'Contact' })
      expect(link).toBeInTheDocument()
    })

    it('treats michaeluloth.com URLs as internal', () => {
      render(<Link href="https://michaeluloth.com/blog">Blog</Link>)
      const link = screen.getByRole('link', { name: 'Blog' })
      expect(link).toBeInTheDocument()
    })

    it('forwards ariaLabel to internal link', () => {
      render(
        <Link href="/search" ariaLabel="Search the site">
          🔍
        </Link>,
      )
      const link = screen.getByRole('link', { name: 'Search the site' })
      expect(link).toBeInTheDocument()
    })

    it('forwards ariaCurrent to internal link', () => {
      render(
        <Link href="/current" ariaCurrent="page">
          Current Page
        </Link>,
      )
      const link = screen.getByRole('link', { name: 'Current Page' })
      expect(link).toHaveAttribute('aria-current', 'page')
    })

    it('applies link class by default', () => {
      render(<Link href="/about">About</Link>)
      const link = screen.getByRole('link', { name: 'About' })
      expect(link).toHaveClass('link')
    })

    it('allows overriding className', () => {
      render(
        <Link href="/about" className="custom-link">
          About
        </Link>,
      )
      const link = screen.getByRole('link', { name: 'About' })
      expect(link).toHaveClass('custom-link')
      expect(link).not.toHaveClass('link')
    })
  })

  describe('external links', () => {
    it('renders a URL that only mentions the site in its path as external', () => {
      render(<Link href="https://github.com/ooloth/michaeluloth.com">Repo</Link>)
      const link = screen.getByRole('link', { name: 'Repo' })
      expect(link).toHaveAttribute('href', 'https://github.com/ooloth/michaeluloth.com')
      expect(link).toHaveAttribute('rel', 'noreferrer')
    })

    it('renders external link with anchor tag', () => {
      render(<Link href="https://example.com">Example</Link>)
      const link = screen.getByRole('link', { name: 'Example' })
      expect(link).toHaveAttribute('href', 'https://example.com')
    })

    it('adds rel="noreferrer" to external links', () => {
      render(<Link href="https://example.com">Example</Link>)
      const link = screen.getByRole('link', { name: 'Example' })
      expect(link).toHaveAttribute('rel', 'noreferrer')
    })

    it('forwards ariaLabel to external link', () => {
      render(
        <Link href="https://github.com/ooloth" ariaLabel="GitHub">
          <span>GH</span>
        </Link>,
      )
      const link = screen.getByRole('link', { name: 'GitHub' })
      expect(link).toBeInTheDocument()
    })

    it('applies link class by default', () => {
      render(<Link href="https://example.com">Example</Link>)
      const link = screen.getByRole('link', { name: 'Example' })
      expect(link).toHaveClass('link')
    })

    it('allows overriding className', () => {
      render(
        <Link href="https://example.com" className="external-link">
          Example
        </Link>,
      )
      const link = screen.getByRole('link', { name: 'Example' })
      expect(link).toHaveClass('external-link')
      expect(link).not.toHaveClass('link')
    })
  })
})

/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Link, { normalizeInternalHref } from './link'

describe('normalizeInternalHref', () => {
  describe('adds missing slashes', () => {
    it('adds leading slash when missing', () => {
      expect(normalizeInternalHref('blog')).toBe('/blog/')
    })

    it('adds trailing slash when missing', () => {
      expect(normalizeInternalHref('/blog')).toBe('/blog/')
    })

    it('adds both slashes when both missing', () => {
      expect(normalizeInternalHref('about')).toBe('/about/')
    })
  })

  describe('preserves existing slashes', () => {
    it('preserves leading and trailing slashes', () => {
      expect(normalizeInternalHref('/blog/')).toBe('/blog/')
    })

    it('preserves nested paths', () => {
      expect(normalizeInternalHref('/blog/post/')).toBe('/blog/post/')
    })
  })

  describe('removes domain', () => {
    it('strips michaeluloth.com domain', () => {
      expect(normalizeInternalHref('https://michaeluloth.com/blog')).toBe('/blog/')
    })

    it('strips domain and normalizes slashes', () => {
      expect(normalizeInternalHref('https://michaeluloth.com/about')).toBe('/about/')
    })

    it('handles domain with trailing slash', () => {
      expect(normalizeInternalHref('https://michaeluloth.com/blog/')).toBe('/blog/')
    })
  })

  describe('deduplicates slashes', () => {
    it('removes duplicate slashes', () => {
      expect(normalizeInternalHref('//blog//')).toBe('/blog/')
    })

    it('handles multiple consecutive slashes', () => {
      expect(normalizeInternalHref('///blog///')).toBe('/blog/')
    })
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

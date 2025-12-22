/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from './footer'

describe('Footer', () => {
  it('renders copyright with current year', () => {
    render(<Footer />)
    const currentYear = new Date().getFullYear()
    expect(screen.getByText(`© ${currentYear} Michael Uloth`)).toBeInTheDocument()
  })

  it('renders social navigation list', () => {
    render(<Footer />)
    const nav = screen.getByRole('list')
    expect(nav).toBeInTheDocument()
  })

  describe('social links accessibility', () => {
    it('RSS link has accessible name', () => {
      render(<Footer />)
      const link = screen.getByRole('link', { name: 'RSS' })
      expect(link).toHaveAttribute('href', '/rss.xml')
    })

    it('YouTube link has accessible name', () => {
      render(<Footer />)
      const link = screen.getByRole('link', { name: 'YouTube' })
      expect(link).toHaveAttribute('href', 'https://youtube.com/michaeluloth')
    })

    it('GitHub link has accessible name', () => {
      render(<Footer />)
      const link = screen.getByRole('link', { name: 'GitHub' })
      expect(link).toHaveAttribute('href', 'https://github.com/ooloth')
    })

    it('X (Twitter) link has accessible name', () => {
      render(<Footer />)
      const link = screen.getByRole('link', { name: 'X (Twitter)' })
      expect(link).toHaveAttribute('href', 'https://x.com/ooloth')
    })

    it('LinkedIn link has accessible name', () => {
      render(<Footer />)
      const link = screen.getByRole('link', { name: 'LinkedIn' })
      expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/michaeluloth')
    })

    it('all social links are present', () => {
      render(<Footer />)
      const links = screen.getAllByRole('link')
      // 5 social links total
      expect(links).toHaveLength(5)
    })
  })

  it('renders icons as decorative images', () => {
    render(<Footer />)
    // Icons should have alt="" which gives them role="presentation"
    const images = screen.queryAllByRole('presentation')
    expect(images).toHaveLength(5) // One icon per social link
    images.forEach(img => {
      expect(img).toHaveAttribute('alt', '')
    })
  })
})

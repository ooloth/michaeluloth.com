/**
 * @vitest-environment happy-dom
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ProseLayout from './layout'

// Mock the child components
vi.mock('@/ui/header', () => ({
  default: () => <header>Header</header>,
}))

vi.mock('@/ui/footer', () => ({
  default: () => <footer>Footer</footer>,
}))

describe('ProseLayout', () => {
  describe('skip link', () => {
    it('renders skip link with correct href and text', () => {
      render(<ProseLayout>Test content</ProseLayout>)

      const skipLink = screen.getByRole('link', { name: /skip to main content/i })
      expect(skipLink).toBeInTheDocument()
      expect(skipLink).toHaveAttribute('href', '#main')
    })

    it('has sr-only class for screen reader only visibility', () => {
      render(<ProseLayout>Test content</ProseLayout>)

      const skipLink = screen.getByRole('link', { name: /skip to main content/i })
      expect(skipLink).toHaveClass('sr-only')
    })

    it('renders skip link as first element for keyboard navigation', () => {
      const { container } = render(<ProseLayout>Test content</ProseLayout>)

      // Get the first anchor element in the container
      const firstLink = container.querySelector('a')
      expect(firstLink).toHaveTextContent('Skip to main content')
    })
  })

  it('renders children', () => {
    render(<ProseLayout>Test child content</ProseLayout>)
    expect(screen.getByText('Test child content')).toBeInTheDocument()
  })

  it('renders header and footer', () => {
    render(<ProseLayout>Content</ProseLayout>)
    expect(screen.getByText('Header')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })
})

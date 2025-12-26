/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Heading from './heading'

describe('Heading', () => {
  describe('heading level validation', () => {
    it.each([
      { level: 1, tag: 'h1' },
      { level: 2, tag: 'h2' },
      { level: 3, tag: 'h3' },
      { level: 4, tag: 'h4' },
      { level: 5, tag: 'h5' },
      { level: 6, tag: 'h6' },
    ])('renders $tag for level $level', ({ level, tag }) => {
      render(<Heading level={level}>Test Heading</Heading>)
      const heading = screen.getByRole('heading', { level })
      expect(heading.tagName.toLowerCase()).toBe(tag)
      expect(heading).toHaveTextContent('Test Heading')
    })

    it.each([
      { level: 0, error: 'Unsupported heading level: 0' },
      { level: 7, error: 'Unsupported heading level: 7' },
      { level: -1, error: 'Unsupported heading level: -1' },
    ])('throws error for invalid level $level', ({ level, error }) => {
      expect(() => render(<Heading level={level}>Invalid</Heading>)).toThrow(error)
    })
  })

  describe('typography classes', () => {
    it.each([
      { level: 1, classes: ['text-[2.25rem]', 'leading-[1.1]', 'font-bold'] },
      { level: 2, classes: ['text-[1.6rem]', 'font-semibold'] },
      { level: 3, classes: ['text-xl', 'font-semibold'] },
      { level: 4, classes: ['text-lg', 'font-semibold'] },
      { level: 5, classes: ['text-base', 'font-semibold'] },
      { level: 6, classes: ['text-sm', 'font-semibold'] },
    ])('applies correct typography for h$level', ({ level, classes }) => {
      render(<Heading level={level}>Heading</Heading>)
      const heading = screen.getByRole('heading', { level })
      expect(heading).toHaveClass(...classes)
    })
  })

  describe('base classes', () => {
    it('always applies base classes', () => {
      render(<Heading level={2}>Test</Heading>)
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('break-after-avoid', 'leading-tight', 'text-bright')
    })
  })

  describe('margin classes', () => {
    it.each([
      { level: 1, topMargin: 'mt-0' },
      { level: 2, topMargin: 'mt-8' },
      { level: 3, topMargin: 'mt-8' },
      { level: 4, topMargin: 'mt-6' },
      { level: 5, topMargin: 'mt-4' },
      { level: 6, topMargin: 'mt-4' },
    ])('applies $topMargin for h$level', ({ level, topMargin }) => {
      render(<Heading level={level}>Heading</Heading>)
      const heading = screen.getByRole('heading', { level })
      expect(heading).toHaveClass(topMargin, 'mb-0')
    })

    it.each([
      { customClass: 'mt-12', description: 'custom mt-*' },
      { customClass: 'my-6', description: 'custom my-*' },
    ])('skips default top margin when $description class present', ({ customClass }) => {
      render(<Heading level={2} className={customClass}>Custom</Heading>)
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).not.toHaveClass('mt-8')
      expect(heading).toHaveClass(customClass)
    })

    it.each([
      { customClass: 'mb-4', description: 'custom mb-*' },
      { customClass: 'my-6', description: 'custom my-*' },
    ])('skips default bottom margin when $description class present', ({ customClass }) => {
      render(<Heading level={2} className={customClass}>Custom</Heading>)
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).not.toHaveClass('mb-0')
      expect(heading).toHaveClass(customClass)
    })
  })

  describe('custom className merging', () => {
    it('merges custom className with defaults', () => {
      render(<Heading level={2} className="text-red-500">Custom Color</Heading>)
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('text-red-500', 'break-after-avoid', 'mt-8', 'mb-0')
    })

    it('handles multiple custom classes', () => {
      render(<Heading level={2} className="text-red-500 underline">Multiple Custom</Heading>)
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('text-red-500', 'underline', 'break-after-avoid')
    })
  })

  describe('edge cases', () => {
    it('handles undefined className', () => {
      render(<Heading level={2}>No Custom Class</Heading>)
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('mt-8', 'mb-0')
    })

    it('renders with empty children', () => {
      render(<Heading level={2}></Heading>)
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toBeInTheDocument()
      expect(heading).toBeEmptyDOMElement()
    })

    it('renders with React node children', () => {
      render(
        <Heading level={2}>
          <span>Nested</span> content
        </Heading>
      )
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent('Nested content')
    })
  })
})

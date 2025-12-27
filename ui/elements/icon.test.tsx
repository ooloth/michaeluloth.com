/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Icon from './icon'

// Mock SVG import (StaticImageData structure)
const mockIcon = {
  src: '/test-icon.svg',
  width: 24,
  height: 24,
  blurWidth: 0,
  blurHeight: 0,
}

describe('Icon', () => {
  it('renders with empty alt attribute to mark as decorative', () => {
    render(<Icon src={mockIcon} />)
    // Images with alt="" get role="presentation" to mark them as decorative
    const img = screen.getByRole('presentation')
    expect(img).toHaveAttribute('alt', '')
  })

  it('uses icon dimensions by default', () => {
    render(<Icon src={mockIcon} />)
    const img = screen.getByRole('presentation')
    expect(img).toHaveAttribute('width', '24')
    expect(img).toHaveAttribute('height', '24')
  })

  it('allows overriding width and height', () => {
    render(<Icon src={mockIcon} width={32} height={32} />)
    const img = screen.getByRole('presentation')
    expect(img).toHaveAttribute('width', '32')
    expect(img).toHaveAttribute('height', '32')
  })

  it('applies CSS mask with icon source', () => {
    render(<Icon src={mockIcon} />)
    const img = screen.getByRole('presentation')
    expect(img).toHaveStyle({
      mask: 'url("/test-icon.svg") no-repeat center / contain',
    })
  })

  it('uses currentColor for icon color', () => {
    render(<Icon src={mockIcon} />)
    const img = screen.getByRole('presentation')
    expect(img).toHaveStyle({ backgroundColor: 'currentcolor' })
  })

  it('forwards additional props to img element', () => {
    render(<Icon src={mockIcon} className="custom-class" data-testid="test-icon" />)
    const img = screen.getByRole('presentation')
    expect(img).toHaveClass('custom-class')
    expect(img).toHaveAttribute('data-testid', 'test-icon')
  })
})

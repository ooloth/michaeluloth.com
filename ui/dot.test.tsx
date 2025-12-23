/**
 * @vitest-environment happy-dom
 */

import { render } from '@testing-library/react'
import Dot from './dot'

describe('Dot', () => {
  it('renders a bullet character', () => {
    const { container } = render(<Dot />)
    expect(container.textContent).toBe('•')
  })

  it('applies accent color by default', () => {
    const { container } = render(<Dot />)
    const span = container.querySelector('span')
    expect(span).toHaveClass('text-accent')
  })

  it('applies accent color when specified', () => {
    const { container } = render(<Dot color="accent" />)
    const span = container.querySelector('span')
    expect(span).toHaveClass('text-accent')
  })

  it('applies bright color when specified', () => {
    const { container } = render(<Dot color="bright" />)
    const span = container.querySelector('span')
    expect(span).toHaveClass('text-bright')
  })

  it('applies no color class for foreground', () => {
    const { container } = render(<Dot color="foreground" />)
    const span = container.querySelector('span')
    expect(span).not.toHaveClass('text-accent')
    expect(span).not.toHaveClass('text-bright')
    expect(span).not.toHaveClass('text-zinc-500')
    expect(span).toHaveClass('font-extrabold')
  })

  it('applies muted color when specified', () => {
    const { container } = render(<Dot color="muted" />)
    const span = container.querySelector('span')
    expect(span).toHaveClass('text-zinc-500')
  })

  it('always applies font-extrabold class', () => {
    const { container: container1 } = render(<Dot color="accent" />)
    const { container: container2 } = render(<Dot color="muted" />)
    const { container: container3 } = render(<Dot color="foreground" />)

    expect(container1.querySelector('span')).toHaveClass('font-extrabold')
    expect(container2.querySelector('span')).toHaveClass('font-extrabold')
    expect(container3.querySelector('span')).toHaveClass('font-extrabold')
  })
})

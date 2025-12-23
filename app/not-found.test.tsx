/**
 * @vitest-environment happy-dom
 */

import { render, screen } from '@testing-library/react'
import NotFound from './not-found'

describe('NotFound', () => {
  it('renders main landmark with correct id', async () => {
    const jsx = await NotFound()
    render(jsx)

    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
    expect(main).toHaveAttribute('id', 'main')
  })

  it('renders 404 heading', async () => {
    const jsx = await NotFound()
    render(jsx)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Oops! There's no page here.")
  })

  it('renders large 404 text', async () => {
    const jsx = await NotFound()
    render(jsx)

    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('renders Browse Blog link', async () => {
    const jsx = await NotFound()
    render(jsx)

    const blogLink = screen.getByRole('link', { name: 'Browse Blog' })
    // Link component normalizes to /blog/ but Next.js Link in test env renders original
    expect(blogLink).toHaveAttribute('href', '/blog')
  })

  it('renders Go Home link', async () => {
    const jsx = await NotFound()
    render(jsx)

    const homeLink = screen.getByRole('link', { name: 'Go Home' })
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('renders separator dot between links', async () => {
    const jsx = await NotFound()
    render(jsx)

    const { container } = render(jsx)
    expect(container.textContent).toContain('•')
  })
})

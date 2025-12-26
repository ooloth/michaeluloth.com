/**
 * @vitest-environment happy-dom
 */

import { render, screen } from '@testing-library/react'
import NotFound from './not-found'

// Mock PageLayout to avoid async data fetching in Header/Footer
vi.mock('@/ui/layouts/page-layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

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

  it('renders "Browse Blog" link', async () => {
    const jsx = await NotFound()
    render(jsx)

    expect(screen.getByRole('link', { name: 'Browse Blog' })).toBeInTheDocument()
  })

  it('renders "Go Home" link', async () => {
    const jsx = await NotFound()
    render(jsx)

    expect(screen.getByRole('link', { name: 'Go Home' })).toBeInTheDocument()
  })

  it('renders separator dot between links', async () => {
    const jsx = await NotFound()
    const { container } = render(jsx)

    expect(container.textContent).toContain('•')
  })
})

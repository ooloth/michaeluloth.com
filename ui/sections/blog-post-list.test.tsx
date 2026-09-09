/**
 * @vitest-environment happy-dom
 */

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import PostList from './blog-post-list'
import { createPostListItem } from '@/io/notion/testing/post-factories'

describe('PostList component', () => {
  it('renders posts with dates and links', () => {
    const posts = [
      createPostListItem({ id: '1', slug: 'test-post', title: 'Test Post', firstPublished: '2024-03-15' }),
      createPostListItem({ id: '2', slug: 'another-post', title: 'Another Post', firstPublished: '2024-01-15' }),
    ]

    render(<PostList posts={posts} />)

    // Note: Next.js strips trailing slashes from href attributes
    const testPostLink = screen.getByRole('link', { name: /test post/i })
    expect(testPostLink.getAttribute('href')).toMatch(/\/test-post\/?/)

    const anotherPostLink = screen.getByRole('link', { name: /another post/i })
    expect(anotherPostLink.getAttribute('href')).toMatch(/\/another-post\/?/)

    // Dates are localized based on system timezone
    expect(screen.getByText(/mar \d{1,2}, 2024/i)).toBeInTheDocument()
    expect(screen.getByText(/jan \d{1,2}, 2024/i)).toBeInTheDocument()
  })

  it('renders every post it is given', () => {
    const posts = Array.from({ length: 10 }, (_, i) =>
      createPostListItem({ id: `${i + 1}`, slug: `post-${i + 1}`, title: `Post ${i + 1}` }),
    )

    render(<PostList posts={posts} />)

    expect(screen.getAllByRole('link')).toHaveLength(10)
  })

  it('handles empty posts array gracefully', () => {
    render(<PostList posts={[]} />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('uses slug as fallback when title is empty', () => {
    render(<PostList posts={[createPostListItem({ slug: 'my-slug', title: '' })]} />)

    const link = screen.getByRole('link', { name: 'my-slug' })
    expect(link.getAttribute('href')).toMatch(/\/my-slug\/?/)
  })

  it('renders correct post structure with time elements', () => {
    render(<PostList posts={[createPostListItem({ firstPublished: '2024-03-15' })]} />)

    const timeElements = screen.getAllByRole('time')
    expect(timeElements).toHaveLength(1)
    expect(timeElements[0]).toHaveAttribute('datetime')
    // datetime attribute is an ISO string
    expect(timeElements[0].getAttribute('datetime')).toMatch(/2024-03-15T/)
  })
})

/**
 * @vitest-environment happy-dom
 */

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import FeaturedWriting from './home-featured-writing'
import { createPostListItem } from '@/io/notion/testing/post-factories'
import { type FeaturedPost } from '@/io/notion/partitionPostsByFeatured'

const createFeaturedPost = (overrides: Partial<FeaturedPost> & { featuredOrder: number }): FeaturedPost => ({
  ...createPostListItem(overrides),
  featuredOrder: overrides.featuredOrder,
})

describe('FeaturedWriting section', () => {
  it('renders the heading and the posts it is given', () => {
    render(
      <FeaturedWriting
        posts={[
          createFeaturedPost({ id: '1', slug: 'first', title: 'First', featuredOrder: 1 }),
          createFeaturedPost({ id: '2', slug: 'second', title: 'Second', featuredOrder: 2 }),
        ]}
      />,
    )

    expect(screen.getByRole('heading', { level: 2, name: /featured writing/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it('renders nothing at all when no post is featured', () => {
    const { container } = render(<FeaturedWriting posts={[]} />)

    expect(screen.queryByRole('heading', { name: /featured writing/i })).not.toBeInTheDocument()
    expect(container).toBeEmptyDOMElement()
  })

  it('uses the same heading treatment as Recent Writing', () => {
    render(<FeaturedWriting posts={[createFeaturedPost({ featuredOrder: 1 })]} />)

    // Kept in sync with ui/sections/home-recent-writing.tsx so the two sections are
    // indistinguishable apart from their headings
    expect(screen.getByRole('heading', { level: 2, name: /featured writing/i })).toHaveClass(
      'mt-16',
      'mb-4',
      'leading-tight',
      'text-[1.75rem]',
      'font-semibold',
      'text-bright',
    )
  })
})

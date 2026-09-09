import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'

import { partitionPostsByFeatured } from './partitionPostsByFeatured'
import { createPostListItem } from './testing/post-factories'
import { type PostListItem } from './schemas/post'

const MS_2000 = Date.UTC(2000, 0, 1)
const MS_2030 = Date.UTC(2030, 0, 1)

/**
 * Lists of posts with unique ids and arbitrary featured orders.
 * Deliberately generates nulls, duplicates, negatives and non-contiguous runs,
 * since those are the states a human editing Notion can actually produce.
 */
const postsArbitrary = fc
  .uniqueArray(
    fc.record({
      id: fc.string({ minLength: 1, maxLength: 8 }),
      featuredOrder: fc.option(fc.integer({ min: -50, max: 50 }), { nil: null }),
      firstPublished: fc.integer({ min: MS_2000, max: MS_2030 }).map(ms => new Date(ms).toISOString()),
    }),
    { selector: item => item.id, maxLength: 20 },
  )
  .map(items => items.map(item => createPostListItem(item)))

const sortedIds = (posts: readonly PostListItem[]): string[] => posts.map(post => post.id).sort()

describe('partitionPostsByFeatured', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Duplicate featured orders are legal and warn; silence that for the property runs
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('properties', () => {
    it('places every post in exactly one of the two groups', () => {
      fc.assert(
        fc.property(postsArbitrary, posts => {
          const { featured, unfeatured } = partitionPostsByFeatured(posts)

          expect(sortedIds([...featured, ...unfeatured])).toEqual(sortedIds(posts))
        }),
      )
    })

    it('groups posts by whether they have a featured order', () => {
      fc.assert(
        fc.property(postsArbitrary, posts => {
          const { featured, unfeatured } = partitionPostsByFeatured(posts)

          expect(featured.every(post => post.featuredOrder !== null)).toBe(true)
          expect(unfeatured.every(post => post.featuredOrder === null)).toBe(true)
        }),
      )
    })

    it('orders featured posts by ascending featured order', () => {
      fc.assert(
        fc.property(postsArbitrary, posts => {
          const { featured } = partitionPostsByFeatured(posts)

          for (let i = 1; i < featured.length; i++) {
            expect(featured[i - 1].featuredOrder).toBeLessThanOrEqual(featured[i].featuredOrder)
          }
        }),
      )
    })

    it('breaks ties on featured order by putting the most recently published first', () => {
      fc.assert(
        fc.property(postsArbitrary, posts => {
          const { featured } = partitionPostsByFeatured(posts)

          for (let i = 1; i < featured.length; i++) {
            if (featured[i - 1].featuredOrder === featured[i].featuredOrder) {
              expect(featured[i - 1].firstPublished >= featured[i].firstPublished).toBe(true)
            }
          }
        }),
      )
    })

    it('produces the same result regardless of the order posts arrive in', () => {
      fc.assert(
        fc.property(postsArbitrary, posts => {
          const forward = partitionPostsByFeatured(posts)
          const reversed = partitionPostsByFeatured([...posts].reverse())

          expect(forward.featured.map(post => post.id)).toEqual(reversed.featured.map(post => post.id))
        }),
      )
    })
  })

  describe('examples', () => {
    it('returns two empty groups when given no posts', () => {
      expect(partitionPostsByFeatured([])).toEqual({ featured: [], unfeatured: [] })
    })

    it('treats featured order as a sort key, not a position', () => {
      const { featured } = partitionPostsByFeatured([
        createPostListItem({ id: '1', slug: 'third', featuredOrder: 30 }),
        createPostListItem({ id: '2', slug: 'first', featuredOrder: 10 }),
        createPostListItem({ id: '3', slug: 'second', featuredOrder: 20 }),
      ])

      // Gaps and a start above 1 are supported: only the relative order matters
      expect(featured.map(post => post.slug)).toEqual(['first', 'second', 'third'])
    })

    it('warns when two featured posts share the same order', () => {
      partitionPostsByFeatured([
        createPostListItem({ id: '1', slug: 'a', featuredOrder: 2 }),
        createPostListItem({ id: '2', slug: 'b', featuredOrder: 2 }),
      ])

      expect(warnSpy).toHaveBeenCalledOnce()
      expect(String(warnSpy.mock.calls[0][0])).toMatch(/featured order/i)
    })

    it('does not warn when every featured order is unique', () => {
      partitionPostsByFeatured([
        createPostListItem({ id: '1', slug: 'a', featuredOrder: 1 }),
        createPostListItem({ id: '2', slug: 'b', featuredOrder: 3 }),
      ])

      expect(warnSpy).not.toHaveBeenCalled()
    })
  })
})

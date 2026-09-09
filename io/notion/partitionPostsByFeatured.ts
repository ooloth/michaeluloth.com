import { invariant } from '@/utils/errors/invariant'
import { type PostListItem } from './schemas/post'

/** A post chosen for the home page's Featured Writing section. */
export type FeaturedPost = Omit<PostListItem, 'featuredOrder'> & { featuredOrder: number }

export type PartitionedPosts = Readonly<{
  featured: readonly FeaturedPost[]
  unfeatured: readonly PostListItem[]
}>

const isFeatured = (post: PostListItem): post is FeaturedPost => post.featuredOrder !== null

/**
 * Orders featured posts by the "Featured order" property set in Notion.
 *
 * The number is a sort key, not a position: gaps, sets that do not start at 1, and
 * negative values all order correctly, and gaps are useful because they let a post
 * be inserted between two others without renumbering the rest.
 *
 * Both keys are compared explicitly rather than relying on sort stability plus the
 * caller's fetch order, so the result stays correct if the page ever fetches
 * ascending. Id breaks the remaining tie so the output never depends on the order
 * posts arrived in.
 */
function byFeaturedOrder(a: FeaturedPost, b: FeaturedPost): number {
  if (a.featuredOrder !== b.featuredOrder) return a.featuredOrder - b.featuredOrder
  if (a.firstPublished !== b.firstPublished) return a.firstPublished < b.firstPublished ? 1 : -1
  return a.id < b.id ? -1 : 1
}

/**
 * Duplicate orders are legal and render deterministically, but they are almost always
 * a typo, so they are surfaced in the build log rather than failing the build.
 */
function warnAboutDuplicateOrders(featured: readonly FeaturedPost[]): void {
  const seen = new Set<number>()
  const duplicates = new Set<number>()

  for (const post of featured) {
    if (seen.has(post.featuredOrder)) duplicates.add(post.featuredOrder)
    seen.add(post.featuredOrder)
  }

  if (duplicates.size > 0) {
    const values = [...duplicates].sort((a, b) => a - b).join(', ')
    console.warn(
      `⚠️  Duplicate Notion "Featured order" values: ${values}. Tied posts fall back to most recently published first.`,
    )
  }
}

/**
 * Splits published posts into the ones featured on the home page and everything else.
 *
 * Featured posts come back in the order they should render. The two groups are disjoint
 * and together hold every input post, which is what keeps a post from appearing in both
 * home page sections.
 */
export function partitionPostsByFeatured(posts: readonly PostListItem[]): PartitionedPosts {
  const featured = posts.filter(isFeatured).sort(byFeaturedOrder)
  const unfeatured = posts.filter(post => !isFeatured(post))

  invariant(
    featured.length + unfeatured.length === posts.length,
    'Every post must land in exactly one of featured or unfeatured',
    { posts: posts.length, featured: featured.length, unfeatured: unfeatured.length },
  )

  invariant(
    featured.every((post, index) => index === 0 || featured[index - 1].featuredOrder <= post.featuredOrder),
    'Featured posts must be sorted by ascending featured order',
    { orders: featured.map(post => post.featuredOrder) },
  )

  warnAboutDuplicateOrders(featured)

  return { featured, unfeatured }
}

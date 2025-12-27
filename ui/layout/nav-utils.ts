import type { PostListItem } from '@/io/notion/schemas/post'
import type { NavItem } from '@/ui/layout/nav-types'

/**
 * Determines if the given navigation item corresponds to the current page.
 */
export function isCurrentPage(navItem: NavItem, pathname: string, posts: PostListItem[]): boolean {
  // Exact match?
  if (navItem.href === pathname) {
    return true
  }

  // Blog post?
  if (navItem.href === '/blog/') {
    return posts.some(post => pathname === `/${post.slug}/`)
  }

  // No match
  return false
}

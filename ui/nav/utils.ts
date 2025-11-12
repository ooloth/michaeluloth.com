import type { NavItem } from '@/ui/nav/types'

/**
 * Determines if the given navigation item corresponds to the current page. Assumes all unknown paths are blog posts.
 */
export function isCurrentPage(navItem: NavItem, pathname: string): boolean {
  return navItem.href === pathname || navItem.href === '/blog/'
}

'use client'

import { usePathname } from 'next/navigation'
import { type ReactElement } from 'react'

import Link from '@/ui/elements/link'
import { type PostListItem } from '@/io/notion/schemas/post'
import Emoji from '@/ui/elements/emoji'

// Exported for testing purposes
export type NavItem = {
  text: string
  href: string
}

const nav: NavItem[] = [
  { text: 'Home', href: '/' },
  { text: 'Blog', href: '/blog/' },
  // { text: 'Videos', href: '/videos/' },
  // { text: 'Projects', href: '/projects/' },
  // { text: 'About', href: '/about/' },
  { text: 'Likes', href: '/likes/' },
]

/**
 * Determines if the given navigation item corresponds to the current page.
 * Exported for testing purposes.
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
type Props = Readonly<{
  posts: PostListItem[]
}>

export default function PrimaryNav({ posts }: Props): ReactElement {
  const pathname = usePathname()

  return (
    <nav aria-label="Primary navigation">
      <ul className="flex flex-wrap">
        <li className="pb-1 w-full">
          <Link href="/" className="text-lg font-semibold text-white">
            Michael Uloth <Emoji symbol="👋" />
          </Link>
        </li>

        {nav.map(item => {
          const isCurrent = isCurrentPage(item, pathname, posts) ? 'page' : undefined

          return (
            <li key={item.text} className="me-3 text-lg lowercase">
              <Link href={item.href} ariaCurrent={isCurrent} className="link-nav">
                {item.text}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

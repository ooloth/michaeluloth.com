'use client'

import { usePathname } from 'next/navigation'
import Link from '@/ui/link'

export type NavItem = {
  text: string
  path: string
}

const nav: NavItem[] = [
  { text: 'Home', path: '/' },
  { text: 'Blog', path: '/blog' },
  { text: 'Videos', path: '/videos' },
  { text: 'About', path: '/about' },
]

/**
 * Determines if the given navigation item corresponds to the current page. Assumes all unknown paths are blog posts.
 */
function isCurrentPage(navItem: NavItem, pathname: string): boolean {
  return navItem.path === pathname || navItem.path === '/blog'
}

export default function Header() {
  const pathname = usePathname()

  return (
    <ul className="flex gap-4">
      {nav.map(item => {
        const isCurrent = isCurrentPage(item, pathname) ? 'page' : undefined
        console.log({ pathname, item, isCurrent })

        return (
          <li key={item.text}>
            <Link href={item.path} ariaCurrent={isCurrent} className="link-nav">
              {item.text}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

'use client'

import { usePathname } from 'next/navigation'

import Link from '@/ui/link'
import { type NavItem } from '@/ui/nav/types'
import { isCurrentPage } from '@/ui/nav/utils'

const nav: NavItem[] = [
  { text: 'Projects', href: '/projects' },
  { text: 'Likes', href: '/likes' },
]

export default function SecondaryNav() {
  const pathname = usePathname()

  return (
    <ul className="flex gap-4">
      {nav.map(item => {
        const isCurrent = isCurrentPage(item, pathname) ? 'page' : undefined

        return (
          <li key={item.text}>
            <Link href={item.href} ariaCurrent={isCurrent} className="link-nav">
              {item.text}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

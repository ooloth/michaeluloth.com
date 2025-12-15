'use client'

import { usePathname } from 'next/navigation'
import { type ReactElement } from 'react'

import Link from '@/ui/link'
import { type NavItem } from '@/ui/nav/types'
import { isCurrentPage } from '@/ui/nav/utils'
import { type PostListItem } from '@/io/notion/schemas/post'
import Emoji from '../emoji'

const nav: NavItem[] = [
  { text: 'Home', href: '/' },
  { text: 'Blog', href: '/blog/' },
  // { text: 'Videos', href: '/videos/' },
  // { text: 'Projects', href: '/projects/' },
  // { text: 'About', href: '/about/' },
  { text: 'Likes', href: '/likes/' },
]

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

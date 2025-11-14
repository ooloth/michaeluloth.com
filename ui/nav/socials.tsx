// TODO: replace text with icons?

import Link from '@/ui/link'
import { type NavItem } from '@/ui/nav/types'

const socials: NavItem[] = [
  { text: 'RSS', href: '/rss.xml' },
  { text: 'YouTube', href: 'https://youtube.com/michaeluloth' },
  { text: 'GitHub', href: 'https://github.com/ooloth' },
  { text: 'Twitter', href: 'https://twitter.com/yourprofile' },
  { text: 'LinkedIn', href: 'https://www.linkedin.com/in/yourprofile' },
]

export default function SocialNav() {
  return (
    <ul className="flex gap-4">
      {socials.map(item => (
        <li key={item.text}>
          <Link href={item.href} className="link-nav">
            {item.text}
          </Link>
        </li>
      ))}
    </ul>
  )
}

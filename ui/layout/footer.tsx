import youTubeIcon from '@/public/youtube.svg'
import gitHubIcon from '@/public/github.svg'
import xIcon from '@/public/x.svg'
import linkedInIcon from '@/public/linkedin.svg'
import rssIcon from '@/public/rss.svg'

import Icon from '@/ui/elements/icon'
import Link from '@/ui/elements/link'
import Paragraph from '@/ui/elements/paragraph'
import { SOCIAL_URLS } from '@/seo/constants'

const socials = [
  { label: 'RSS', icon: rssIcon, href: SOCIAL_URLS.rss },
  { label: 'YouTube', icon: youTubeIcon, href: SOCIAL_URLS.youtube },
  { label: 'GitHub', icon: gitHubIcon, href: SOCIAL_URLS.github },
  { label: 'X (Twitter)', icon: xIcon, href: SOCIAL_URLS.twitter },
  { label: 'LinkedIn', icon: linkedInIcon, href: SOCIAL_URLS.linkedin },
] as const

function SocialNav() {
  return (
    <ul className="flex gap-3">
      {socials.map(item => (
        <li key={item.href}>
          <Link href={item.href} className="hover:text-accent" ariaLabel={item.label}>
            <Icon src={item.icon} className="w-7" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
export default function Footer() {
  return (
    <footer className="flex flex-col xs:flex-row items-center justify-between gap-2 mt-24 pb-6">
      <Paragraph className="my-0">&copy; {new Date().getFullYear()} Michael Uloth</Paragraph>
      <SocialNav />
    </footer>
  )
}

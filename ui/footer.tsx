import youTubeIcon from '@/public/youtube.svg'
import gitHubIcon from '@/public/github.svg'
import xIcon from '@/public/x.svg'
import linkedInIcon from '@/public/linkedin.svg'
import rssIcon from '@/public/rss.svg'

import Icon from '@/ui/icon'
import Link from '@/ui/link'
import Paragraph from '@/ui/typography/paragraph'

const socials = [
  { label: 'RSS', icon: rssIcon, href: '/rss.xml' },
  { label: 'YouTube', icon: youTubeIcon, href: 'https://youtube.com/michaeluloth' },
  { label: 'GitHub', icon: gitHubIcon, href: 'https://github.com/ooloth' },
  { label: 'X (Twitter)', icon: xIcon, href: 'https://x.com/ooloth' },
  { label: 'LinkedIn', icon: linkedInIcon, href: 'https://www.linkedin.com/in/michaeluloth' },
] as const

function SocialNav() {
  return (
    <ul className="flex gap-3">
      {socials.map(item => (
        <li key={item.href}>
          <Link href={item.href} className="hover:text-accent" aria-label={item.label}>
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

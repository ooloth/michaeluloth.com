import Anchor from '@/ui/anchor'

const nav = [
  { name: 'Projects', href: '/projects' },
  { name: 'Likes', href: '/likes' },
]

const socials = [
  { name: 'Twitter', href: 'https://twitter.com/yourprofile' },
  { name: 'GitHub', href: 'https://github.com/ooloth' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/yourprofile' },
]

export default function Footer() {
  return (
    <footer className="flex items-center justify-between pb-6">
      <ul className="flex gap-4">
        {nav.map(item => (
          <li key={item.name}>
            <Anchor href={item.href}>{item.name}</Anchor>
          </li>
        ))}
      </ul>

      <ul className="flex gap-4">
        {socials.map(item => (
          <li key={item.name}>
            <Anchor href={item.href}>{item.name}</Anchor>
          </li>
        ))}
      </ul>
    </footer>
  )
}

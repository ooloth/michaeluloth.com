import Image from '@/ui/image'
import Link from '@/ui/link'

const nav = [
  { name: 'Home', href: '/' },
  { name: 'Blog', href: '/blog' },
  { name: 'Videos', href: '/videos' },
  { name: 'About', href: '/about' },
]

export default function Header() {
  return (
    <header className="flex items-center justify-between mb-8 pt-4">
      <ul className="flex gap-4">
        {nav.map(item => (
          <li key={item.name}>
            <Link href={item.href} className="link-nav">
              {item.name}
            </Link>
          </li>
        ))}
      </ul>

      <Image
        url="https://res.cloudinary.com/ooloth/image/upload/v1645057009/mu/michael-landscape.jpg"
        imageStyles="object-cover rounded-full w-10 h-10"
        outerStyles="mt-0 mb-0" // override default margins
      />
    </header>
  )
}

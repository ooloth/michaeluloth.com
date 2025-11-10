import Anchor from '@/ui/anchor'
import Image from '@/ui/image'

const nav = [
  { name: 'Home', href: '/' },
  { name: 'Blog', href: '/blog' },
  { name: 'Videos', href: '/videos' },
  { name: 'About', href: '/about' },
]

export default function Header() {
  return (
    <header className="flex items-center justify-between pt-4">
      <ul className="flex gap-4">
        {nav.map(item => (
          <li key={item.name}>
            <Anchor href={item.href}>{item.name}</Anchor>
          </li>
        ))}
      </ul>

      <Image
        src="https://res.cloudinary.com/ooloth/image/upload/v1645057009/mu/michael-landscape.jpg"
        alt="Logo"
        width={120}
        height={60}
        imageStyles="object-cover rounded-full w-10 h-10"
        outerStyles="mt-0 mb-0" // override default margins
      />
    </header>
  )
}

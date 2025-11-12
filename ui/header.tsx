import Image from '@/ui/image'

import NavTop from './nav-top'

export default function Header() {
  return (
    <header className="flex items-center justify-between mb-8 pt-4">
      <NavTop />

      <Image
        url="https://res.cloudinary.com/ooloth/image/upload/v1645057009/mu/michael-landscape.jpg"
        imageStyles="object-cover rounded-full w-10 h-10"
        outerStyles="mt-0 mb-0" // override default margins
      />
    </header>
  )
}

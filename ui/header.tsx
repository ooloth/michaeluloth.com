import Image from '@/ui/image'

import PrimaryNav from '@/ui/nav/primary'

export default function Header() {
  return (
    <header className="flex items-center justify-between mb-8 pt-4">
      <PrimaryNav />
      <Image
        url="https://res.cloudinary.com/ooloth/image/upload/v1645057009/mu/michael-landscape.jpg"
        imageStyles="object-cover object-[56%_0%] rounded-full w-[2.2em] h-[2.2em]"
        outerStyles="mt-0 mb-0" // override default margins
      />
    </header>
  )
}

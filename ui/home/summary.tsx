import { type ReactElement } from 'react'
import CloudinaryImage from '@/ui/image'
import Paragraph from '@/ui/typography/paragraph'

export default function Summary(): ReactElement {
  return (
    <section className="md:flex md:justify-between md:items-end md:gap-x-9">
      <div>
        <h1 className="leading-tight text-[2.25rem] md:text-[2.5rem] font-bold text-bright">Hey, I&apos;m Michael</h1>
        <Paragraph className="text-lg text-zinc-300">
          I write code for a living. And for fun. It&apos;s hard to stop. Have you tried Claude Code? You really should.
        </Paragraph>
        <Paragraph className="text-zinc-300">
          I&apos;ve built dozens of polished UIs. And a resilient shopping cart. And highly validated data pipelines. I
          care about reliability, ergonomics and getting the details right. Since I&apos;d rather not get paged, I often
          think about what could go wrong and how I can make sure it doesn&apos;t.
        </Paragraph>
      </div>

      <CloudinaryImage
        url="https://res.cloudinary.com/ooloth/image/upload/v1645057009/mu/michael-landscape.jpg"
        effect="grayscale"
        fetchPriority="high"
        imageStyles="object-cover object-[57%_0%] rounded-3xl! w-56 aspect-square"
        outerStyles="flex-none md:my-0" // don't shrink
      />
    </section>
  )
}

import { type ReactElement } from 'react'

import Image from '@/ui/image'
import Paragraph from '@/ui/typography/paragraph'
import PostList from '@/ui/post-list'

function Summary(): ReactElement {
  return (
    <section className="md:flex md:justify-between md:items-end md:gap-x-9">
      <div>
        <h1 className="leading-tight text-[2.5rem] font-bold text-bright">Hey, I&apos;m Michael</h1>
        <Paragraph className="text-lg text-zinc-300">
          I write code for a living. And for fun. It&apos;s hard to stop. Have you tried Claude Code? You really should.
        </Paragraph>
        <Paragraph className="text-zinc-300">
          I&apos;ve built dozens of polished UIs. And a resilient shopping cart. And highly validated data pipelines. I
          care about reliability, ergonomics and getting the details right. And since I&apos;d rather not get paged, I
          often think about what else could go wrong and how to make sure it doesn&apos;t.
        </Paragraph>
      </div>

      <Image
        url="https://res.cloudinary.com/ooloth/image/upload/v1645057009/mu/michael-landscape.jpg"
        effect="grayscale"
        loading="eager"
        imageStyles="object-cover object-[57%_0%] rounded-3xl! w-56 aspect-square"
        outerStyles="flex-none md:my-0" // don't shrink
      />
    </section>
  )
}

type RecentWritingProps = Readonly<{
  skipCache: boolean
}>

function RecentWriting({ skipCache }: RecentWritingProps): ReactElement {
  return (
    <section>
      <h2 className="mt-16 mb-4 leading-tight text-[1.65rem] font-semibold text-bright">Recent Writing</h2>
      <PostList limit={5} skipCache={skipCache} />
    </section>
  )
}

type Props = Readonly<{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}>

export default async function Home({ searchParams }: Props): Promise<ReactElement> {
  const params = await searchParams
  const skipCache = params.nocache === 'true'

  return (
    <main className="flex-auto">
      <Summary />
      <RecentWriting skipCache={skipCache} />
    </main>
  )
}

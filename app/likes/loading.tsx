import { type ReactElement } from 'react'
import Heading from '@/ui/typography/heading'

function SkeletonCard({ height }: { height: 'h-72' | 'h-48' }): ReactElement {
  return (
    <div className="flex-none w-48">
      <div className={`${height} bg-zinc-800 rounded-lg animate-pulse`} />

      <div className="flex flex-col items-center">
        <div className="mt-4 h-5 w-full bg-zinc-800 rounded animate-pulse" />
        <div className="mt-2 h-4 w-3/4 bg-zinc-800 rounded animate-pulse" />
        <div className="mt-2 h-4 w-1/2 bg-zinc-800 rounded animate-pulse" />
      </div>
    </div>
  )
}

function SkeletonSection({ title, height }: { title: string; height: 'h-72' | 'h-48' }): ReactElement {
  return (
    <section>
      <Heading level={2}>{title}</Heading>
      <div className="flex gap-10 overflow-x-auto hide-scrollbar mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} height={height} />
        ))}
      </div>
    </section>
  )
}

export default function Loading(): ReactElement {
  return (
    <main className="flex-auto">
      <Heading level={1}>Likes</Heading>

      <div className="pt-8">
        <SkeletonSection title="TV Shows" height="h-72" />
        <SkeletonSection title="Movies" height="h-72" />
        <SkeletonSection title="Books" height="h-72" />
        <SkeletonSection title="Albums" height="h-48" />
        <SkeletonSection title="Podcasts" height="h-48" />
      </div>
    </main>
  )
}

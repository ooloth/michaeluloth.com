// TODO: use emoji component
// TODO: I think we want to render this on [slug]/ui/post.tsx

import getPropertyValue from '@/lib/notion/getPropertyValue'
import Card from '@/ui/card'
import Emoji from '@/ui/emoji'

type Props = Readonly<{
  prevPost: any | null
  nextPost: any | null
}>

export default function PaginationLinks({ prevPost, nextPost }: Props) {
  return (
    <nav className="mt-20 flex flex-col md:flex-row gap-5 ">
      {prevPost ? <PaginationLink post={prevPost} direction="Previous" /> : <div className="basis-1/2" />}
      {nextPost ? <PaginationLink post={nextPost} direction="Next" /> : <div className="basis-1/2" />}
    </nav>
  )
}

type PaginationLinkProps = Readonly<{
  post: { title: string; slug: string }
  direction: 'Previous' | 'Next'
}>

function PaginationLink({ post, direction }: PaginationLinkProps) {
  if (!post.title) {
    throw new Error(`Post is missing a title: ${JSON.stringify(post)}`)
  }

  const href = `/${post.slug}/`
  const emoji = direction === 'Previous' ? '👈' : '👉'
  const directionText = direction === 'Previous' ? 'Older' : 'Newer'

  return (
    <Card href={href}>
      <div className={`basis-1/2 flex items-center ${direction === 'Next' ? 'justify-end' : null} py-3 px-4`}>
        <span className={`flex gap-4 items-center ${direction === 'Next' ? 'flex-row-reverse' : null}`}>
          <Emoji symbol={emoji} className="text-2xl" />
          <span className={`${direction === 'Next' ? 'text-right' : null}`}>
            <span className="block capitalize text-[0.95em]">{directionText}</span>
            <span className="block leading-snug font-light text-lg text-bright">{post.title}</span>
          </span>
        </span>
      </div>
    </Card>
  )
}

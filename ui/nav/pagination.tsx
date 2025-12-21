import Card from '@/ui/card'
import Emoji from '@/ui/emoji'
import type { PostListItem } from '@/io/notion/schemas/post'

type Props = Readonly<{
  prevPost: PostListItem | null
  nextPost: PostListItem | null
}>

const NON_BREAKING_SPACE = '\u00A0'

/**
 * Replaces the last space in a string with a non-breaking space.
 * This prevents awkward line wrapping where the last word appears alone on a new line.
 *
 * @example
 * replaceLastSpaceWithNonBreaking("Hello World")
 * // Returns "Hello World" (with non-breaking space before "World")
 */
export function replaceLastSpaceWithNonBreaking(text: string): string {
  return text.replace(/ (?!.* )/, NON_BREAKING_SPACE)
}

export default function PaginationLinks({ prevPost, nextPost }: Props) {
  return (
    <nav aria-label="Post navigation" className="mt-18 flex flex-col sm:flex-row gap-5">
      {nextPost ? <PaginationLink post={nextPost} direction="Next" /> : <div className="basis-1/2" />}
      {prevPost ? <PaginationLink post={prevPost} direction="Previous" /> : <div className="basis-1/2" />}
    </nav>
  )
}

type PaginationLinkProps = Readonly<{
  post: { title: string; slug: string }
  direction: 'Previous' | 'Next'
}>

function PaginationLink({ post, direction }: PaginationLinkProps) {
  // IMPORTANT: Title is transformed - affects accessible name used in tests
  const displayTitle = replaceLastSpaceWithNonBreaking(post.title)

  const href = `/${post.slug}/`
  const emoji = direction === 'Previous' ? '👉' : '👈'
  const directionText = direction === 'Previous' ? 'Older' : 'Newer'

  return (
    <Card href={href}>
      <div className={`flex items-center ${direction === 'Previous' ? 'justify-end' : null} pt-2.5 pb-4 px-4 h-full`}>
        <span className={`flex gap-4 items-center ${direction === 'Previous' ? 'flex-row-reverse' : null}`}>
          <Emoji symbol={emoji} className="text-2xl" decorative />
          <span className={`${direction === 'Previous' ? 'text-right' : null}`}>
            <span className="block capitalize text-[0.98em]" aria-hidden="true">
              {directionText}
            </span>
            <span className="block leading-[1.3] font-light text-lg text-bright">{displayTitle}</span>
          </span>
        </span>
      </div>
    </Card>
  )
}

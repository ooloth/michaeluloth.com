import { type ReactElement } from 'react'

import { type PostListItem } from '@/io/notion/schemas/post'
import Link from '@/ui/elements/link'

/**
 * Given a date, returns a human-readable date string in the format "Jan 1, 2020".
 */
const getHumanReadableDate = (date: string | number | Date): string =>
  new Date(date).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

/**
 * Given a date, returns a machine-readable date string suitable for use in the `datetime` attribute of the `<time>` element.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time#valid_datetime_values
 *
 * WARN: This errors if passed an undefined date.
 */
const getMachineReadableDate = (date: string | number | Date): string => new Date(date).toISOString()

type PostListProps = Readonly<{
  posts: readonly PostListItem[]
}>

export default function PostList({ posts }: PostListProps): ReactElement {
  return (
    <ul className="ps-0!">
      {posts.map(post => {
        return (
          <li key={post.id} className="list-none mb-7 last:mb-0">
            <article>
              <header>
                <time dateTime={getMachineReadableDate(post.firstPublished)} className="timestamp block md:min-w-28">
                  {getHumanReadableDate(post.firstPublished)}
                </time>

                <Link href={`/${post.slug}/`} className="link-heading heading text-[1.2rem]">
                  {post.title || post.slug}
                </Link>
              </header>
            </article>
          </li>
        )
      })}
    </ul>
  )
}

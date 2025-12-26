import { type ReactElement } from 'react'

import getPosts from '@/io/notion/getPosts'
import Link from '@/ui/link'
import { getHumanReadableDate, getMachineReadableDate } from '@/ui/dates'

type PostListProps = Readonly<{
  limit?: number
  skipCache?: boolean
}>

export default async function PostList({ limit = Infinity, skipCache = false }: PostListProps): Promise<ReactElement> {
  const posts = (await getPosts({ sortDirection: 'descending', skipCache })).unwrap()
  const postsToShow = posts.slice(0, limit) // we avoid limiting at the query level to keep local caching simple

  return (
    <ul className="ps-0!">
      {postsToShow.map(post => {
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

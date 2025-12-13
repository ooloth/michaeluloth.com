import { type ReactElement } from 'react'

import getPosts from '@/lib/notion/getPosts'
import Heading from '@/ui/heading'
import { getHumanReadableDate, getMachineReadableDate } from '@/utils/dates'

type Props = Readonly<{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}>

export default async function Blog({ searchParams }: Props): Promise<ReactElement> {
  const params = await searchParams
  const skipCache = params.nocache === 'true'

  const posts = (await getPosts({ sortDirection: 'descending', skipCache })).unwrap()

  return (
    <main className="flex-auto">
      <Heading level={1}>Blog</Heading>

      <ul className="mt-8 grid gap-8">
        {posts.map(post => {
          return (
            <li key={post.id} className="grid">
              <article>
                <header>
                  <time
                    dateTime={getMachineReadableDate(post.firstPublished)}
                    className="timestamp block mb-0.5 md:min-w-28"
                  >
                    {getHumanReadableDate(post.firstPublished)}
                  </time>

                  <a href={`/${post.slug}/`} className="link-heading heading text-xl">
                    {post.title || post.slug}
                  </a>
                </header>
              </article>
            </li>
          )
        })}
      </ul>
    </main>
  )
}

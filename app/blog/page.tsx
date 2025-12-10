import { type ReactElement } from 'react'

import getPosts from '@/lib/notion/getPosts'
import getPropertyValue from '@/lib/notion/getPropertyValue'
import Heading from '@/ui/heading'
import { getHumanReadableDate, getMachineReadableDate } from '@/utils/dates'

type Props = Readonly<{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}>

export default async function Blog({ searchParams }: Props): Promise<ReactElement> {
  const params = await searchParams
  const skipCache = params.nocache === 'true'

  const posts = await getPosts({ sortDirection: 'descending', skipCache })

  return (
    <main className="flex-auto">
      <Heading level={1}>Blog</Heading>

      <ul className="mt-8 grid gap-8">
        {posts.map(post => {
          const slug = getPropertyValue(post.properties, 'Slug')
          const title = getPropertyValue(post.properties, 'Title')
          const date = getPropertyValue(post.properties, 'First published')

          return (
            <li key={post.id} className="grid">
              <article>
                <header>
                  <time dateTime={getMachineReadableDate(date)} className="timestamp block mb-0.5 md:min-w-28">
                    {getHumanReadableDate(date)}
                  </time>

                  <a href={`/${slug}/`} className="link-heading heading text-xl">
                    {title || slug}
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

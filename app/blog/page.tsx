import { type ReactElement } from 'react'

import getPosts from '@/lib/notion/getPosts'
import getPropertyValue from '@/lib/notion/getPropertyValue'
import Card from '@/ui/card'
import Emoji from '@/ui/emoji'
import Image from '@/ui/image'
import Heading from '@/ui/heading'

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

      <ul className="mt-6 grid md:grid-cols-2 gap-4">
        {posts.map(post => {
          const title = getPropertyValue(post.properties, 'Title')
          const slug = getPropertyValue(post.properties, 'Slug')
          const type = getPropertyValue(post.properties, 'Type')
          const image = getPropertyValue(post.properties, 'Featured image')

          return (
            <li key={post.id} className="grid">
              <Card href={`/${slug}/`}>
                {image ? (
                  <Image
                    url={image}
                    showCaption={false}
                    outerStyles="my-0!"
                    imageStyles="rounded-t-xl rounded-b-none"
                  />
                ) : null}

                <div className="flex gap-3 py-3 px-4">
                  <Emoji symbol={type === 'reaction' ? '🔖' : '✍'} className="text-2xl" />
                  <p className="text-xl font-medium md:text-lg">{title}</p>
                </div>
              </Card>
            </li>
          )
        })}
      </ul>
    </main>
  )
}

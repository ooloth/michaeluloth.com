import { type ReactElement } from 'react'

import getPosts from '@/lib/notion/getPosts'
import getPropertyValue from '@/lib/notion/getPropertyValue'
import Card from '@/ui/card'
import Emoji from '@/ui/emoji'
import Image from '@/ui/image'
import Heading from '@/ui/heading'

export default async function Blog(): Promise<ReactElement> {
  'use cache'

  const posts = await getPosts('descending')

  return (
    <main className="flex-auto">
      <Heading level={1}>Blog</Heading>

      <ul className="mt-6 grid gap-4">
        {posts.map(post => {
          const title = getPropertyValue(post.properties, 'Title')
          const slug = getPropertyValue(post.properties, 'Slug')
          const type = getPropertyValue(post.properties, 'Type')
          const image = getPropertyValue(post.properties, 'Featured image')

          return (
            <li key={post.id} className="grid">
              <Card href={`/${slug}/`}>
                {image ? <Image url={image} showCaption={false} /> : null}

                <div className="flex items-center gap-2">
                  <Emoji symbol={type === 'reaction' ? '🔖' : '✍'} />
                  {title}
                </div>
              </Card>
            </li>
          )
        })}
      </ul>
    </main>
  )
}

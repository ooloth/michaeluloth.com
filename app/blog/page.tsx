import { type ReactElement } from 'react'

import getPosts from '@/lib/notion/getPosts'
import getPropertyValue from '@/lib/notion/getPropertyValue'
import Card from '@/ui/card'
import Link from '@/ui/link'

export default async function Blog(): Promise<ReactElement> {
  'use cache'

  const posts = await getPosts('descending')

  return (
    <main className="flex-auto">
      <h1>Blog</h1>
      <ul>
        {posts.map(post => {
          const title = getPropertyValue(post.properties, 'Title')
          const slug = getPropertyValue(post.properties, 'Slug')

          return (
            <li key={post.id} className="flex gap-4">
              <Card href={`/${slug}/`}>{title}</Card>
            </li>
          )
        })}
      </ul>
    </main>
  )
}

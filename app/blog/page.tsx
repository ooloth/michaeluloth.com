import { type ReactElement } from 'react'

import getPosts from '@/io/notion/getPosts'
import PageLayout from '@/ui/layout/page-layout'
import PostList from '@/ui/sections/blog-post-list'
import JsonLdScript from '@/seo/json-ld/script'
import { metadata } from '@/seo/pages/blog'

export default async function Blog(): Promise<ReactElement> {
  const posts = (await getPosts({ sortDirection: 'descending' })).unwrap()

  return (
    <PageLayout>
      <h1 className="sr-only">Blog</h1>
      <section>
        <h2 className="sr-only">Blog posts</h2>
        <PostList posts={posts} />
      </section>
      <JsonLdScript type="blog" />
    </PageLayout>
  )
}

export { metadata }

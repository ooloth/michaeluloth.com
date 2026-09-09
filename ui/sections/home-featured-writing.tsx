import { type ReactElement } from 'react'
import { type FeaturedPost } from '@/io/notion/partitionPostsByFeatured'
import PostList from '@/ui/sections/blog-post-list'

type FeaturedWritingProps = Readonly<{
  posts: readonly FeaturedPost[]
}>

export default function FeaturedWriting({ posts }: FeaturedWritingProps): ReactElement | null {
  // Omit the section entirely rather than rendering a heading above nothing
  if (posts.length === 0) return null

  return (
    <section>
      <h2 className="mt-16 mb-4 leading-tight text-[1.75rem] font-semibold text-bright">Featured Writing</h2>
      <PostList posts={posts} />
    </section>
  )
}

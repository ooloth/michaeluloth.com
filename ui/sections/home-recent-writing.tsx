import { type ReactElement } from 'react'
import PostList from '@/ui/sections/blog-post-list'

export default function RecentWriting(): ReactElement {
  return (
    <section>
      <h2 className="mt-16 mb-4 leading-tight text-[1.75rem] font-semibold text-bright">Recent Writing</h2>
      <PostList limit={5} />
    </section>
  )
}

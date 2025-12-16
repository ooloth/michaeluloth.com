import NotionBlocks from '@/io/notion/ui/NotionBlocks'
import type { Post as PostType, PostListItem } from '@/io/notion/schemas/post'
import PaginationLinks from '@/ui/nav/pagination'

import PostHeader from './post-header'
import PostFooter from './post-footer'

type Props = Readonly<{
  post: PostType
  prevPost: PostListItem | null
  nextPost: PostListItem | null
}>

export default function Post({ post, prevPost, nextPost }: Props) {
  return (
    <main className="flex_auto">
      <article>
        <PostHeader title={post.title} datePublished={post.firstPublished} dateUpdated={post.lastEditedTime} />
        <NotionBlocks blocks={post.blocks} />
        <PostFooter />
        <PaginationLinks prevPost={prevPost} nextPost={nextPost} />
      </article>
    </main>
  )
}

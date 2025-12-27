import NotionBlocks from '@/io/notion/ui/NotionBlocks'
import type { Post as PostType, PostListItem } from '@/io/notion/schemas/post'
import PaginationLinks from '@/ui/sections/post-pagination'

import PostHeader from './post-header'
import PostFooter from './post-footer'

type Props = Readonly<{
  post: PostType
  prevPost: PostListItem | null
  nextPost: PostListItem | null
}>

export default function Post({ post, prevPost, nextPost }: Props) {
  return (
    <div className="flex-auto flex flex-col">
      <article>
        <PostHeader title={post.title} datePublished={post.firstPublished} />
        <NotionBlocks blocks={post.blocks} />
        <PostFooter /> {/* needs to be a client component */}
      </article>

      {/* Pagination is site navigation, not post content, so it lives outside <article> */}
      <PaginationLinks className="mt-auto" prevPost={prevPost} nextPost={nextPost} />
    </div>
  )
}

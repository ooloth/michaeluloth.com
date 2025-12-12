import NotionBlocks from '@/lib/notion/ui/NotionBlocks'
import type { Post as PostType, PostListItem } from '@/lib/notion/schemas/post'
// import { Code } from '@/ui/code'
import PaginationLinks from '@/ui/nav/pagination'

import PostHeader from './post-header'
import PostFooter from './post-footer'
import Subscribe from './subscribe'

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

        {/* <details className="my-10"> */}
        {/*   <summary className="font-bold text-white">Notion API response JSON...</summary> */}
        {/*   <Code code={JSON.stringify(post, null, 2)} lang="json" /> */}
        {/* </details> */}

        <PostFooter />
        <Subscribe />
        <PaginationLinks prevPost={prevPost} nextPost={nextPost} />
      </article>
    </main>
  )
}

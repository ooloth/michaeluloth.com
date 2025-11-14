import NotionBlocks from '@/lib/notion/ui/NotionBlocks'
import getPropertyValue from '@/lib/notion/getPropertyValue'
// import { Code } from '@/ui/code'
import PaginationLinks from '@/ui/nav/pagination'

import PostHeader from './post-header'
import PostFooter from './post-footer'
import Subscribe from './subscribe'

type Props = Readonly<{
  post: any
  prevPost: any | null
  nextPost: any | null
}>

export default function Post({ post, prevPost, nextPost }: Props) {
  const title = getPropertyValue(post.properties, 'Title')
  const datePublished = getPropertyValue(post.properties, 'First published')

  return (
    <main className="flex_auto">
      <article>
        <PostHeader title={title} datePublished={datePublished} dateUpdated={post.last_edited_time} />
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

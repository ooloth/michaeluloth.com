import NotionBlocks from '@/lib/notion/ui/NotionBlocks'
import getPropertyValue from '@/lib/notion/getPropertyValue'
import { Code } from '@/ui/code'

import PostHeader from './post-header'
import PostFooter from './post-footer'

type Props = Readonly<{
  post: any
}>

export default function Post({ post }: Props) {
  const title = getPropertyValue(post.properties, 'Title')
  const datePublished = getPropertyValue(post.properties, 'First published')

  return (
    <article>
      <PostHeader title={title} datePublished={datePublished} dateUpdated={post.last_edited_time} />
      <NotionBlocks blocks={post.blocks} />
      <PostFooter />

      <details className="mt-10">
        <summary className="font-bold text-white">Notion API response JSON...</summary>
        <Code code={JSON.stringify(post, null, 2)} lang="json" />
      </details>
    </article>
  )
}

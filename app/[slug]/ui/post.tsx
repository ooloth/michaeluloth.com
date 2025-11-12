// TODO: add giscus comments widget

import NotionBlocks from '@/lib/notion/ui/NotionBlocks'
import getPropertyValue from '@/lib/notion/getPropertyValue'
import { Code } from '@/ui/code'

export default function Post({ post }) {
import PostHeader from './post-header'
  const title = getPropertyValue(post.properties, 'Title')
  const datePublished = getPropertyValue(post.properties, 'First published')

  return (
    <article>
      <PostHeader title={title} datePublished={datePublished} dateUpdated={post.last_edited_time} />
      <NotionBlocks blocks={post.blocks} />
      <Footer post={post} />
    </article>
  )
}

type FooterProps = Readonly<{
  post: any
}>

function Footer({ post }: FooterProps) {
  return (
    <footer className="my-10">
      <details className="mt-10">
        <summary className="font-bold text-white">Notion API response JSON...</summary>
        <Code code={JSON.stringify(post, null, 2)} lang="json" />
      </details>
    </footer>
  )

  // return (
  //   <a href={discussUrl(frontMatter.slug)} target="_blank" rel="noreferrer">
  //     Discuss on Twitter
  //   </a>
  // )
}

// const discussUrl = slug =>
//   `https://mobile.twitter.com/search?q=${encodeURIComponent(
//     `https://michaeluloth.com/${slug}`,
//   )}`

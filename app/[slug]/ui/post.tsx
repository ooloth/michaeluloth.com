import { format } from 'timeago.js'

import NotionBlocks from '@/lib/notion/ui/NotionBlocks'
import getPropertyValue from '@/lib/notion/getPropertyValue'
import { Code } from '@/ui/code'
import Heading from '@/ui/heading'
import Paragraph from '@/ui/paragraph'

export default function Post({ post }) {
  const title = getPropertyValue(post.properties, 'Title')
  const datePublished = getPropertyValue(post.properties, 'First published')

  return (
    <article>
      <Header title={title} date={post.last_edited_time} />
      <NotionBlocks blocks={post.blocks} />
      <Footer post={post} date={datePublished} />
    </article>
  )
}

type HeaderProps = Readonly<{
  title: string
  date: string
}>

function Header({ title, date }: HeaderProps) {
  return (
    <header className="mb-6">
      <Heading level={1}>{title}</Heading>
      <Paragraph className="mt-1 italic text-zinc-400">Last updated {format(date)}</Paragraph>
    </header>
  )
}

type FooterProps = Readonly<{
  post: any
  date: string
}>

function Footer({ post, date }: FooterProps) {
  return (
    <footer className="my-10">
      <Paragraph className="italic text-zinc-400">First published {format(date)}</Paragraph>

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

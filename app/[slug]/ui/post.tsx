// TODO: add giscus comments widget

import { format } from 'timeago.js'

import NotionBlocks from '@/lib/notion/ui/NotionBlocks'
import getPropertyValue from '@/lib/notion/getPropertyValue'
import { Code } from '@/ui/code'
import Heading from '@/ui/heading'
import Paragraph from '@/ui/paragraph'
import { getHumanReadableDate } from '@/utils/dates'

export default function Post({ post }) {
  const title = getPropertyValue(post.properties, 'Title')
  const datePublished = getPropertyValue(post.properties, 'First published')

  return (
    <article>
      <Header title={title} datePublished={datePublished} dateUpdated={post.last_edited_time} />
      <NotionBlocks blocks={post.blocks} />
      <Footer post={post} />
    </article>
  )
}

type HeaderProps = Readonly<{
  title: string
  datePublished: string
  dateUpdated: string
}>

function Header({ title, datePublished, dateUpdated }: HeaderProps) {
  return (
    <header className="mb-6">
      <Paragraph className="mt-0 text-[0.85em] text-zinc-400">
        <span>{getHumanReadableDate(datePublished)}</span>
        <span className="px-1.5 font-extrabold text-accent">•</span>
        <span>Updated {format(dateUpdated)}</span>
      </Paragraph>

      <Heading level={1} className="mt-0">
        {title}
      </Heading>
    </header>
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

// import { format } from 'timeago.js'

import NotionBlocks from '@/lib/notion/ui/NotionBlocks'
import getPropertyValue from '@/lib/notion/getPropertyValue'
import { Code } from '@/ui/code'
import Heading from '@/ui/heading'

export default function Post({ post }) {
  const title = getPropertyValue(post.properties, 'Title')

  return (
    <article>
      <Header title={title} />
      <NotionBlocks blocks={post.blocks} />
      <Footer post={post} />
    </article>
  )
}

type HeaderProps = Readonly<{
  title: string
}>

function Header({ title }: HeaderProps) {
  return (
    <header className="mb-8">
      <Heading level={1}>{title}</Heading>
      {/* <Paragraph className="mt-3 text-sm text-gray-700 dark:text-gray-500">Updated {format(date)}</p> */}
    </header>
  )
}

type FooterProps = Readonly<{
  post: any
}>

function Footer({ post }: FooterProps) {
  return (
    <footer className="my-12">
      <details>
        <summary className="font-bold text-white">Notion API response JSON...</summary>
        <Code code={JSON.stringify(post, null, 2)} lang="json" />
      </details>
    </footer>
  )

  // return (
  //   <footer className="mt-12 text-sm text-gray-700 dark:text-gray-300">
  //     <a href={discussUrl(frontMatter.slug)} target="_blank" rel="noopener noreferrer">
  //       {'Discuss on Twitter'}
  //     </a>
  //     {` • `}
  //     <a href={editUrl(frontMatter.slug)} target="_blank" rel="noopener noreferrer">
  //       {'Edit on GitHub'}
  //     </a>
  //   </footer>
  // )
}

// const discussUrl = slug =>
//   `https://mobile.twitter.com/search?q=${encodeURIComponent(
//     `https://michaeluloth.com/${slug}`,
//   )}`

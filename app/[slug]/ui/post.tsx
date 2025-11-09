// import { format } from 'timeago.js'

import Blocks from '@/lib/notion/ui/Blocks'
import getPropertyValue from '@/lib/notion/getPropertyValue'
import { Code } from '@/ui/code'
import Heading from '@/ui/heading'
// import Emoji from '@/ui/emoji'
// import { transformCloudinaryImage } from '@/lib/cloudinary/utils'

export default function Post({ post }) {
  const title = getPropertyValue(post.properties, 'Title')

  return (
    <>
      <article className="flex flex-col gap-y-4">
        <header>
          <Heading level={1}>{title}</Heading>
          {/* <Paragraph className="mt-3 text-sm text-gray-700 dark:text-gray-500">Updated {format(date)}</p> */}
        </header>

        <div className="mt-8 prose dark:prose-dark lg:prose-lg dark:lg:prose-lg">
          <Blocks blocks={post.blocks} />
        </div>
      </article>

      <Code code={`\`\`\`json${JSON.stringify(post, null, 2)}\`\`\``} />
    </>
  )
}

// const discussUrl = slug =>
//   `https://mobile.twitter.com/search?q=${encodeURIComponent(
//     `https://michaeluloth.com/${slug}`,
//   )}`

// const editUrl = slug =>
//   `https://github.com/ooloth/mu-next/edit/master/content/blog/${slug}.mdx`

// function BlogFooter(frontMatter) {
//   return (
//     <footer className="mt-12 text-sm text-gray-700 dark:text-gray-300">
//       <a
//         href={discussUrl(frontMatter.slug)}
//         target="_blank"
//         rel="noopener noreferrer"
//       >
//         {'Discuss on Twitter'}
//       </a>
//       {` • `}
//       <a href={editUrl(frontMatter.slug)} target="_blank" rel="noopener noreferrer">
//         {'Edit on GitHub'}
//       </a>
//     </footer>
//   )
// }

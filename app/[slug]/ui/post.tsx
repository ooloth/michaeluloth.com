// import { NextSeo, ArticleJsonLd } from 'next-seo'
// import { format } from 'timeago.js'

import Blocks from '@/lib/notion/ui/Blocks'
import getPropertyValue from '@/lib/notion/getPropertyValue'
import Heading from '@/ui/heading'
// import Outer from '@/layouts/outer'
// import Emoji from '@/ui/emoji'
// import { transformCloudinaryImage } from '@/lib/cloudinary/utils'
// import { useEffect } from 'react'
// import Prism from 'prismjs'

export default function Post({ post }) {
  const type = getPropertyValue(post.properties, 'Type')
  const title = getPropertyValue(post.properties, 'Title')
  const slug = getPropertyValue(post.properties, 'Slug')
  const description = getPropertyValue(post.properties, 'Description')
  const featuredImage = getPropertyValue(post.properties, 'Featured image')
  const date = getPropertyValue(post.properties, 'First published')

  return (
    <>
      {/* <ArticleSeo title={title} slug={slug} description={description} featuredImage={featuredImage} date={date} /> */}

      <article>
        <header>
          <Heading level={1}>{title}</Heading>
          {/* <p className="mt-3 text-sm text-gray-700 dark:text-gray-500">Updated {format(date)}</p> */}
        </header>

        <div className="mt-8 prose dark:prose-dark lg:prose-lg dark:lg:prose-lg">
          <Blocks blocks={post.blocks} />
        </div>
      </article>

      <div className="" />
      <pre className="bg-slate-900">{JSON.stringify(post, null, 2)}</pre>
    </>
  )
}

// const ArticleSeo = ({ title, slug, description, featuredImage, date }) => {
//   const url = `https://michaeluloth.com/${slug}`
//   const formattedDate = new Date(date).toISOString()
//
//   const image = featuredImage
//     ? featuredImage.includes('cloudinary')
//       ? {
//           url: transformCloudinaryImage(featuredImage, 1280),
//           alt: title,
//         }
//       : {
//           url: `https://michaeluloth.com${featuredImage}`,
//           alt: title,
//         }
//     : {
//         alt: 'Michael Uloth smiling into the camera',
//         url: transformCloudinaryImage('https://res.cloudinary.com/ooloth/image/upload/mu/michael-landscape.jpg', 1280),
//       }
//
//   useEffect(() => {
//     Prism.highlightAll()
//   }, [])
//
//   return (
//     <>
//       <NextSeo
//         title={title}
//         description={description}
//         canonical={url}
//         openGraph={{
//           type: 'article',
//           article: {
//             publishedTime: formattedDate,
//           },
//           url,
//           title,
//           description,
//           images: [image],
//         }}
//       />
//       <ArticleJsonLd
//         authorName="Michael Uloth"
//         dateModified={date}
//         datePublished={date}
//         description={description}
//         images={[image.url]}
//         publisherLogo="/static/favicons/android-chrome-192x192.png"
//         publisherName="Michael Uloth"
//         title={title}
//         url={url}
//       />
//     </>
//   )
// }

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

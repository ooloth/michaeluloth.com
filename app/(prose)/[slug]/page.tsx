import { notFound } from 'next/navigation'

import getPost from '@/lib/notion/getPost'
import getPosts from '@/lib/notion/getPosts'

import Post from './ui/post'

type Params = {
  slug: string
}

type Props = Readonly<{
  params: Promise<Params>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}>

export default async function DynamicRoute({ params, searchParams }: Props) {
  const slug = (await params).slug
  const search = await searchParams
  const skipCache = search.nocache === 'true'

  // TODO: use fetch instead? https://nextjs.org/docs/app/api-reference/functions/fetch
  const post = await getPost({ slug, includeBlocks: true, includePrevAndNext: true, skipCache })
  if (!post) {
    notFound()
  }

  // TODO: metadata: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
  // const type = getPropertyValue(post.properties, 'Type')
  // const title = getPropertyValue(post.properties, 'Title')
  // const description = getPropertyValue(post.properties, 'Description')
  // const featuredImage = getPropertyValue(post.properties, 'Featured image')
  // const date = getPropertyValue(post.properties, 'First published')
  // <ArticleSeo title={title} slug={slug} description={description} featuredImage={featuredImage} date={date} />

  return <Post post={post} prevPost={post.prevPost} nextPost={post.nextPost} />
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

/**
 * Generates the list of static params (slugs) for all blog posts.
 * Replaces getStaticPaths in Next.js 13+
 *
 * @returns A promise that resolves to an array of objects containing post slugs.
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-static-params
 */
export async function generateStaticParams(): Promise<Params[]> {
  const posts = (await getPosts({ sortDirection: 'ascending' })).unwrap()

  return posts.map(post => ({ slug: post.slug }))
}

import getPost from '@/lib/notion/getPost'
import getPosts from '@/lib/notion/getPosts'
import getPropertyValue from '@/lib/notion/getPropertyValue'

import Post from './ui/post'

type Params = {
  slug: string
  prevSlug: string | null
  nextSlug: string | null
}

type Props = Readonly<{
  params: Promise<Params>
}>

export default async function DynamicRoute({ params }: Props) {
  // See: https://nextjs.org/docs/messages/next-prerender-current-time
  'use cache'

  const { slug, prevSlug, nextSlug } = await params

  // TODO: use fetch instead? https://nextjs.org/docs/app/api-reference/functions/fetch
  const post = await getPost({ slug, includeBlocks: true })
  const prevPost = getPost({ slug: prevSlug })
  const nextPost = getPost({ slug: nextSlug })

  // TODO: metadata: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
  // const type = getPropertyValue(post.properties, 'Type')
  // const title = getPropertyValue(post.properties, 'Title')
  // const description = getPropertyValue(post.properties, 'Description')
  // const featuredImage = getPropertyValue(post.properties, 'Featured image')
  // const date = getPropertyValue(post.properties, 'First published')

  // <ArticleSeo title={title} slug={slug} description={description} featuredImage={featuredImage} date={date} />

  return <Post post={post} prevPost={prevPost} nextPost={nextPost} />
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
  const posts = await getPosts()
  const postSlugs: string[] = posts.map(post => getPropertyValue(post.properties, 'Slug'))

  const prevSlug = (slug: string) => {
    const index = postSlugs.indexOf(slug)
    return index > 0 ? postSlugs[index - 1] : null
  }

  const nextSlug = (slug: string) => {
    const index = postSlugs.indexOf(slug)
    return index < postSlugs.length - 1 ? postSlugs[index + 1] : null
  }

  return postSlugs.map(slug => ({
    slug,
    prevSlug: prevSlug(slug),
    nextSlug: nextSlug(slug),
  }))
}

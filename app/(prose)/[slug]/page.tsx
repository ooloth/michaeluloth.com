import { type Metadata } from 'next'
import { notFound } from 'next/navigation'

import getPost from '@/io/notion/getPost'
import getPosts from '@/io/notion/getPosts'
import { SITE_URL, SITE_NAME, SITE_AUTHOR, TWITTER_HANDLE, DEFAULT_OG_IMAGE } from '@/utils/metadata'
import { transformCloudinaryForOG } from '@/io/cloudinary/ogImageTransforms'
import type { Post as PostType } from '@/io/notion/schemas/post'

import Post from './ui/post'

type Params = {
  slug: string
}

type Props = Readonly<{
  params: Promise<Params>
}>

export default async function DynamicRoute({ params }: Props) {
  const slug = (await params).slug

  const post = (await getPost({ slug, includeBlocks: true, includePrevAndNext: true })).unwrap()

  if (!post) {
    notFound()
  }

  const jsonLd = generateJsonLd(post, slug)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // Escape < to prevent XSS if content contains </script>
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <Post post={post} prevPost={post.prevPost} nextPost={post.nextPost} />
    </>
  )
}

/**
 * Constructs the full URL for a blog post.
 */
function getPostUrl(slug: string): string {
  return `${SITE_URL}${slug}/`
}

type JsonLdArticle = {
  '@context': string
  '@type': string
  headline: string
  description: string
  datePublished: string
  dateModified: string
  author: {
    '@type': string
    name: string
  }
  image: string
  url: string
}

/**
 * Generates JSON-LD structured data for a blog post.
 * @see https://schema.org/Article
 */
function generateJsonLd(post: PostType, slug: string): JsonLdArticle {
  const url = getPostUrl(slug)
  const rawImage = post.featuredImage ?? DEFAULT_OG_IMAGE
  const image = transformCloudinaryForOG(rawImage)

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.firstPublished,
    dateModified: post.lastEditedTime,
    author: {
      '@type': 'Person',
      name: SITE_AUTHOR,
    },
    image,
    url,
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug
  const post = (await getPost({ slug })).unwrap()

  if (!post) {
    return {}
  }

  const url = getPostUrl(slug)
  const rawImage = post.featuredImage ?? DEFAULT_OG_IMAGE
  const ogImage = transformCloudinaryForOG(rawImage)

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      url,
      siteName: SITE_NAME,
      locale: 'en_CA',
      title: post.title,
      description: post.description,
      publishedTime: post.firstPublished,
      modifiedTime: post.lastEditedTime,
      authors: [SITE_AUTHOR],
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      creator: TWITTER_HANDLE,
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
  }
}

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

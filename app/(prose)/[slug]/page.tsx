import { type Metadata } from 'next'
import { notFound } from 'next/navigation'

import getPost from '@/io/notion/getPost'
import getPosts from '@/io/notion/getPosts'
import { SITE_URL, SITE_NAME, SITE_AUTHOR, DEFAULT_OG_IMAGE } from '@/utils/metadata'
import { transformCloudinaryForOG } from '@/io/cloudinary/ogImageTransforms'
import type { Post as PostType } from '@/io/notion/schemas/post'

import Post from './ui/post'

type Params = {
  slug: string
}

type Props = Readonly<{
  params: Promise<Params>
}>

/**
 * Generates JSON-LD structured data for a blog post.
 * @see https://schema.org/Article
 */
function generateJsonLd(post: PostType, slug: string) {
  const url = `${SITE_URL}${slug}/`
  const rawImage = post.featuredImage ?? DEFAULT_OG_IMAGE
  const image = transformCloudinaryForOG(rawImage)

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description ?? undefined,
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

  const url = `${SITE_URL}${slug}/`
  const rawImage = post.featuredImage ?? DEFAULT_OG_IMAGE
  const ogImage = transformCloudinaryForOG(rawImage)

  return {
    title: post.title,
    description: post.description ?? undefined,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      url,
      siteName: SITE_NAME,
      locale: 'en_CA',
      title: post.title,
      description: post.description ?? undefined,
      publishedTime: post.firstPublished,
      modifiedTime: post.lastEditedTime,
      authors: [SITE_AUTHOR],
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      creator: '@ooloth',
      title: post.title,
      description: post.description ?? undefined,
      images: [ogImage],
    },
  }
}

export default async function DynamicRoute({ params }: Props) {
  const slug = (await params).slug

  const post = (await getPost({ slug, includeBlocks: true, includePrevAndNext: true })).unwrap()

  if (!post) {
    notFound()
  }

  const jsonLd = generateJsonLd(post, slug)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Post post={post} prevPost={post.prevPost} nextPost={post.nextPost} />
    </>
  )
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

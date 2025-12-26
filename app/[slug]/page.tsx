import { type Metadata } from 'next'
import { notFound } from 'next/navigation'

import getPost from '@/io/notion/getPost'
import getPosts from '@/io/notion/getPosts'
import { SITE_NAME, SITE_AUTHOR, TWITTER_HANDLE, DEFAULT_OG_IMAGE, SITE_LOCALE } from '@/seo/constants'
import { transformCloudinaryForOG } from '@/io/cloudinary/ogImageTransforms'
import { getPostUrl } from '@/seo/json-ld/article'
import JsonLdScript from '@/seo/json-ld/script'

import PageLayout from '@/ui/layouts/page-layout'
import Post from '@/ui/post/post'

type Params = {
  slug: string
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug
  const post = (await getPost({ slug })).unwrap()

  if (!post) {
    // TODO: confirm if this is the right behaviour; what pages would this apply to?
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
      locale: SITE_LOCALE,
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

type Props = Readonly<{
  params: Promise<Params>
}>

export default async function DynamicRoute({ params }: Props) {
  const slug = (await params).slug
  const post = (await getPost({ slug, includeBlocks: true, includePrevAndNext: true })).unwrap()

  if (!post) {
    notFound()
  }

  return (
    <PageLayout>
      <Post post={post} prevPost={post.prevPost} nextPost={post.nextPost} />
      <JsonLdScript type="article" post={post} />
    </PageLayout>
  )
}

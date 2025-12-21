import { type Metadata } from 'next'
import { notFound } from 'next/navigation'

import getPost from '@/io/notion/getPost'
import getPosts from '@/io/notion/getPosts'
import { SITE_URL, SITE_AUTHOR, DEFAULT_OG_IMAGE } from '@/utils/metadata'

import Post from './ui/post'

type Params = {
  slug: string
}

type Props = Readonly<{
  params: Promise<Params>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}>

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug
  const post = (await getPost({ slug })).unwrap()

  if (!post) {
    return {}
  }

  const url = `${SITE_URL}${slug}/`
  const image = post.featuredImage ?? DEFAULT_OG_IMAGE

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.description ?? undefined,
      publishedTime: post.firstPublished,
      modifiedTime: post.lastEditedTime,
      authors: [SITE_AUTHOR],
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description ?? undefined,
      images: [image],
    },
  }
}

export default async function DynamicRoute({ params, searchParams }: Props) {
  const slug = (await params).slug
  const search = await searchParams
  const skipCache = search.nocache === 'true'

  const post = (await getPost({ slug, includeBlocks: true, includePrevAndNext: true, skipCache })).unwrap()

  if (!post) {
    notFound()
  }

  return <Post post={post} prevPost={post.prevPost} nextPost={post.nextPost} />
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

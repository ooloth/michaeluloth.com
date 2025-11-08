import getPost from '@/lib/notion/getPost'
import getPosts from '@/lib/notion/getPosts'
import getPropertyValue from '@/lib/notion/getPropertyValue'

import Post from './ui/post'

type Props = Readonly<{
  params: Promise<{
    slug: string
  }>
}>

export default async function DynamicRoute({ params }: Props) {
  // See: https://nextjs.org/docs/messages/next-prerender-current-time
  'use cache'

  const slug = (await params).slug
  const post = await getPost({ slug, includeBlocks: true })

  return <Post post={post} />
}

/**
 * Generates the list of static params (slugs) for all blog posts.
 * Replaces getStaticPaths in Next.js 13+
 *
 * @returns A promise that resolves to an array of objects containing post slugs.
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-static-params
 */
export async function generateStaticParams() {
  const posts = await getPosts()
  const postSlugs: string[] = posts.map(post => getPropertyValue(post.properties, 'Slug'))

  return postSlugs.map(slug => ({ slug }))
}

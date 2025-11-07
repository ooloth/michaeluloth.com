// import Article from 'templates/article'
import getPost from '@/lib/notion/getPost'
import getPosts from '@/lib/notion/getPosts'

export default async function DynamicRoute({ params }: { params: Promise<{ slug: string }> }) {
  // See: https://nextjs.org/docs/messages/next-prerender-current-time
  'use cache'

  const { slug } = await params

  const post = await getPost(slug)
  console.log('post', post)

  // return <Article article={article} />

  return null
}

/**
 * Generates the list of static params (slugs) for all blog posts.
 * Replaces getStaticPaths in Next.js 13+
 *
 * @returns A promise that resolves to an array of objects containing slugs.
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-static-params
 */
export async function generateStaticParams() {
  const posts = await getPosts()
  const postSlugs: string[] = posts.map(post => post.properties['Slug'].rich_text[0].plain_text)

  return postSlugs.map(slug => ({ slug }))
}

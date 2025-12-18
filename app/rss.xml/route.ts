import { Feed } from 'feed'
import getPosts from '@/io/notion/getPosts'
import getPost from '@/io/notion/getPost'
import { renderBlocksToHtml } from '@/io/notion/renderBlocksToHtml'

const SITE_URL = 'https://michaeluloth.com'

export const dynamic = 'force-static'

export async function GET() {
  console.log('[RSS] Starting RSS feed generation...')
  const posts = (await getPosts({ sortDirection: 'descending' })).unwrap()
  console.log(`[RSS] Found ${posts.length} posts`)

  const feed = new Feed({
    title: 'Michael Uloth',
    description: 'Software engineer helping scientists discover new medicines at Recursion.',
    id: SITE_URL,
    link: SITE_URL,
    language: 'en',
    favicon: `${SITE_URL}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, Michael Uloth`,
    author: {
      name: 'Michael Uloth',
      link: SITE_URL,
    },
  })

  // Fetch full content for each post
  for (const postItem of posts) {
    console.log(`[RSS] Fetching content for: ${postItem.slug}`)
    const post = (await getPost({ slug: postItem.slug, includeBlocks: true })).unwrap()
    if (!post) {
      console.log(`[RSS] Skipping null post: ${postItem.slug}`)
      continue
    }

    const content = post.featuredImage
      ? `<img src="${post.featuredImage}" alt="${post.title}" />\n${renderBlocksToHtml(post.blocks)}`
      : renderBlocksToHtml(post.blocks)

    feed.addItem({
      title: post.title,
      id: `${SITE_URL}/${post.slug}/`,
      link: `${SITE_URL}/${post.slug}/`,
      description: post.description ?? undefined,
      content,
      date: new Date(post.firstPublished),
      author: [{ name: 'Michael Uloth', link: SITE_URL }],
    })
    console.log(`[RSS] Added post: ${postItem.slug}`)
  }

  console.log('[RSS] RSS feed generation complete')

  return new Response(feed.rss2(), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

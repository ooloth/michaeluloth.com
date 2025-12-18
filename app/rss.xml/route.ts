import { Feed } from 'feed'
import getPosts from '@/io/notion/getPosts'
import getBlockChildren from '@/io/notion/getBlockChildren'
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

  // Fetch blocks for each post (we already have metadata from getPosts)
  for (const postItem of posts) {
    console.log(`[RSS] Fetching blocks for: ${postItem.slug}`)
    const blocksResult = await getBlockChildren(postItem.id)

    if (!blocksResult.ok) {
      console.error(`[RSS] Failed to fetch blocks for ${postItem.slug}:`, blocksResult.error)
      continue
    }

    const content = postItem.featuredImage
      ? `<img src="${postItem.featuredImage}" alt="${postItem.title}" />\n${renderBlocksToHtml(blocksResult.value)}`
      : renderBlocksToHtml(blocksResult.value)

    feed.addItem({
      title: postItem.title,
      id: `${SITE_URL}/${postItem.slug}/`,
      link: `${SITE_URL}/${postItem.slug}/`,
      description: postItem.description ?? undefined,
      content,
      date: new Date(postItem.firstPublished),
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

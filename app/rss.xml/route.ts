import { Feed } from 'feed'
import getPosts from '@/io/notion/getPosts'
import getBlockChildren from '@/io/notion/getBlockChildren'
import { renderBlocksToHtml } from '@/io/notion/renderBlocksToHtml'

const SITE_URL = 'https://michaeluloth.com/'

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
    language: 'en-ca',
    favicon: `${SITE_URL}favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, Michael Uloth`,
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

    // Use feedId if present (for historical feed stability), otherwise construct permalink
    const permalink = postItem.feedId || `${SITE_URL}${postItem.slug}/`

    feed.addItem({
      title: postItem.title,
      id: permalink,
      link: permalink,
      description: postItem.description ?? undefined,
      content,
      date: new Date(postItem.firstPublished),
      // Note: author tag added via post-processing below (RSS 2.0 spec requires email in author tag)
    })
    console.log(`[RSS] Added post: ${postItem.slug}`)
  }

  console.log('[RSS] RSS feed generation complete')

  // Generate RSS XML and transform to match old feed format exactly
  const rssXml = feed
    .rss2()
    // Replace isPermaLink with permalink attribute
    .replace(/isPermaLink=/g, 'permalink=')
    .replace(/permalink="false"/g, 'permalink="true"')
    // Add author tag to each item (after content:encoded)
    .replace(/(<\/content:encoded>)/g, '$1\n      <author>Michael Uloth</author>')
    // Remove docs and generator elements
    .replace(/\s*<docs>.*?<\/docs>\n?/g, '')
    .replace(/\s*<generator>.*?<\/generator>\n?/g, '')

  return new Response(rssXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

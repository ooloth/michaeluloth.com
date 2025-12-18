import { Feed } from 'feed'
import getPosts from '@/io/notion/getPosts'
import getPost from '@/io/notion/getPost'
import { renderBlocksToHtml } from '@/io/notion/renderBlocksToHtml'

const SITE_URL = 'https://michaeluloth.com'

export async function GET() {
  const posts = (await getPosts({ sortDirection: 'descending' })).unwrap()

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
    const post = (await getPost({ slug: postItem.slug, includeBlocks: true })).unwrap()
    if (!post) continue

    feed.addItem({
      title: post.title,
      id: `${SITE_URL}/${post.slug}/`,
      link: `${SITE_URL}/${post.slug}/`,
      description: post.description ?? undefined,
      content: renderBlocksToHtml(post.blocks),
      date: new Date(post.firstPublished),
      author: [{ name: 'Michael Uloth', link: SITE_URL }],
    })
  }

  return new Response(feed.rss2(), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

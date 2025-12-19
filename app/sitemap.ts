import type { MetadataRoute } from 'next'
import getPosts from '@/io/notion/getPosts'

const SITE_URL = 'https://michaeluloth.com/'

export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = (await getPosts({ sortDirection: 'descending' })).unwrap()

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}blog`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}likes`, priority: 0.5 },
  ]

  const blogPosts: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}${post.slug}/`,
    lastModified: new Date(post.firstPublished),
    priority: 0.7,
  }))

  return [...staticPages, ...blogPosts]
}

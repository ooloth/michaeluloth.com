import { SITE_URL, SITE_AUTHOR } from '@/seo/constants'

/**
 * JSON-LD Blog schema type.
 * @see https://schema.org/Blog
 */
export type JsonLdBlog = {
  '@context': string
  '@type': string
  name: string
  description: string
  url: string
  author: {
    '@type': string
    name: string
    url: string
  }
}

/**
 * Generates JSON-LD structured data for the blog collection page.
 * Used on /blog/ to represent the blog as a whole.
 * @see https://schema.org/Blog
 */
export function generateBlogJsonLd(): JsonLdBlog {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: "Michael Uloth's Blog",
    description: 'Articles about software engineering, web development, and building better tools.',
    url: `${SITE_URL}blog/`,
    author: {
      '@type': 'Person',
      name: SITE_AUTHOR,
      url: SITE_URL,
    },
  }
}

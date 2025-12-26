import type { Post } from '@/io/notion/schemas/post'
import { SITE_URL, SITE_AUTHOR, DEFAULT_OG_IMAGE } from '@/seo/constants'
import { transformCloudinaryForOG } from '@/io/cloudinary/ogImageTransforms'

/**
 * JSON-LD Article schema type.
 * @see https://schema.org/Article
 */
export type JsonLdArticle = {
  '@context': string
  '@type': string
  headline: string
  description: string
  datePublished: string
  dateModified: string
  author: {
    '@type': string
    name: string
  }
  image: string
  url: string
}

/**
 * Constructs the full URL for a blog post.
 */
export function getPostUrl(slug: string): string {
  return `${SITE_URL}${slug}/`
}

/**
 * Generates JSON-LD structured data for a blog post.
 * @see https://schema.org/Article
 */
export function generateArticleJsonLd(post: Post): JsonLdArticle {
  const url = getPostUrl(post.slug)
  const rawImage = post.featuredImage ?? DEFAULT_OG_IMAGE
  const image = transformCloudinaryForOG(rawImage)

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.firstPublished,
    dateModified: post.lastEditedTime,
    author: {
      '@type': 'Person',
      name: SITE_AUTHOR,
    },
    image,
    url,
  }
}

import { type Metadata } from 'next'

import { transformCloudinaryForOG } from '@/io/cloudinary/ogImageTransforms'
import { type Post } from '@/io/notion/schemas/post'
import { SITE_NAME, SITE_AUTHOR, TWITTER_HANDLE, DEFAULT_OG_IMAGE, SITE_LOCALE } from '@/seo/constants'
import { getPostUrl } from '@/seo/json-ld/article'

export default function metadata(post: Post): Metadata {
  const url = getPostUrl(post.slug)
  const rawImage = post.featuredImage ?? DEFAULT_OG_IMAGE
  const ogImage = transformCloudinaryForOG(rawImage)

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      url,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      title: post.title,
      description: post.description,
      publishedTime: post.firstPublished,
      modifiedTime: post.lastEditedTime,
      authors: [SITE_AUTHOR],
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      creator: TWITTER_HANDLE,
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
  }
}

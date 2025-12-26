import { type Metadata } from 'next'
import { type ReactElement } from 'react'

import PageLayout from '@/ui/layouts/page-layout'
import PostList from '@/ui/post-list'
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, TWITTER_HANDLE } from '@/seo/constants'
import { generateBlogJsonLd } from '@/seo/json-ld/blog'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Technical writing about web development, TypeScript, React, and software engineering.',
  openGraph: {
    type: 'website',
    url: `${SITE_URL}blog/`,
    siteName: SITE_NAME,
    locale: 'en_CA',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    creator: TWITTER_HANDLE,
    title: 'Blog',
    description: 'Technical writing about web development, TypeScript, React, and software engineering.',
    images: [DEFAULT_OG_IMAGE],
  },
}

export default async function Blog(): Promise<ReactElement> {
  const jsonLd = generateBlogJsonLd()

  return (
    <PageLayout>
      <h1 className="sr-only">Blog</h1>
      <PostList />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // Escape < to prevent XSS if content contains </script>
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
    </PageLayout>
  )
}

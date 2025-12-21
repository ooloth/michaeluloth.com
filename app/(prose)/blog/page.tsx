import { type Metadata } from 'next'
import { type ReactElement } from 'react'

import PostList from '@/ui/post-list'
import { DEFAULT_OG_IMAGE, SITE_NAME } from '@/utils/metadata'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Technical writing about web development, TypeScript, React, and software engineering.',
  openGraph: {
    type: 'website',
    url: 'https://michaeluloth.com/blog/',
    siteName: SITE_NAME,
    locale: 'en_CA',
    images: [DEFAULT_OG_IMAGE],
  },
}

export default async function Blog(): Promise<ReactElement> {
  return (
    <main className="flex-auto">
      <h1 className="sr-only">Blog</h1>
      <PostList />
    </main>
  )
}

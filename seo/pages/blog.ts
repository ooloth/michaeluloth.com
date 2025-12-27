import { type Metadata } from 'next'

import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, TWITTER_HANDLE, SITE_LOCALE } from '@/seo/constants'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Technical writing about web development, TypeScript, React, and software engineering.',
  openGraph: {
    type: 'website',
    url: `${SITE_URL}blog/`,
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
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

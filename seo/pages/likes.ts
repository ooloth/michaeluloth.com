import { type Metadata } from 'next'

import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, TWITTER_HANDLE, SITE_LOCALE } from '@/seo/constants'

export const metadata: Metadata = {
  title: 'Likes',
  description: 'My favorite TV shows, movies, books, albums, and podcasts',
  openGraph: {
    type: 'website',
    url: `${SITE_URL}likes/`,
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    creator: TWITTER_HANDLE,
    title: 'Likes',
    description: 'My favorite TV shows, movies, books, albums, and podcasts',
    images: [DEFAULT_OG_IMAGE],
  },
}

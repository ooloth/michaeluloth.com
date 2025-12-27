import { type Metadata } from 'next'

import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, TWITTER_HANDLE, TWITTER_CARD, SITE_LOCALE } from '@/seo/constants'

const description = 'My favorite TV shows, movies, books, albums, and podcasts'

export const metadata: Metadata = {
  title: 'Likes',
  description,
  openGraph: {
    type: 'website',
    url: `${SITE_URL}likes/`,
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: TWITTER_CARD,
    creator: TWITTER_HANDLE,
    title: 'Likes',
    description,
    images: [DEFAULT_OG_IMAGE],
  },
}

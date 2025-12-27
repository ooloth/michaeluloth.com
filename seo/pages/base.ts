import { type Metadata } from 'next'

import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_AUTHOR,
  TWITTER_HANDLE,
  TWITTER_CARD,
  DEFAULT_OG_IMAGE,
  SITE_LOCALE,
} from '@/seo/constants'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s • ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  authors: [{ name: SITE_AUTHOR }],
  creator: SITE_AUTHOR,
  openGraph: {
    type: 'website',
    url: SITE_URL,
    locale: SITE_LOCALE,
    siteName: SITE_NAME,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: TWITTER_CARD,
    creator: TWITTER_HANDLE,
  },
  alternates: {
    types: {
      'application/rss+xml': '/rss.xml',
    },
  },
}

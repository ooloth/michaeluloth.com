import { type Metadata } from 'next'
import { type ReactNode } from 'react'

import '@/styles/globals.css'
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_AUTHOR,
  TWITTER_HANDLE,
  DEFAULT_OG_IMAGE,
  SITE_LOCALE,
} from '@/seo/constants'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
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
    card: 'summary_large_image',
    creator: TWITTER_HANDLE,
  },
  alternates: {
    types: {
      'application/rss+xml': '/rss.xml',
    },
  },
}

type Props = Readonly<{
  children: ReactNode
}>

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" className="bg-accent">
      <body className="overflow-x-hidden bg-zinc-900 px-4 min-h-screen antialiased selection:bg-accent selection:text-black leading-relaxed text-[1.1rem] text-zinc-400">
        {children}
      </body>
    </html>
  )
}

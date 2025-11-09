// TODO: app router migration guide: https://nextjs.org/docs/app/guides/migrating/app-router-migration#migrating-_documentjs-and-_appjs
// TODO: metadata: https://nextjs.org/docs/app/getting-started/metadata-and-og-images
// TODO: metadata: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
// TODO: metadata files: https://nextjs.org/docs/app/api-reference/file-conventions/metadata
// TODO: links: https://nextjs.org/docs/app/api-reference/components/link
// TODO: read current page path: https://nextjs.org/docs/app/api-reference/functions/use-pathname
// TODO: read url: https://nextjs.org/docs/app/api-reference/functions/use-search-params
// TODO: data fetching: https://nextjs.org/docs/app/guides/migrating/app-router-migration#step-6-migrating-data-fetching-methods

import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import '@/styles/globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Michael Uloth',
  description: 'Software engineer helping scientists discover new medicines at Recursion.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  )
}

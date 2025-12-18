// TODO: metadata: https://nextjs.org/docs/app/getting-started/metadata-and-og-images
// TODO: metadata: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
// TODO: metadata files: https://nextjs.org/docs/app/api-reference/file-conventions/metadata

import { type Metadata } from 'next'
import { type ReactNode } from 'react'

import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Michael Uloth',
  description: 'Software engineer helping scientists discover new medicines at Recursion.',
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

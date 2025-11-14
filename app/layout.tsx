// TODO: app router migration guide: https://nextjs.org/docs/app/guides/migrating/app-router-migration#migrating-_documentjs-and-_appjs
// TODO: metadata: https://nextjs.org/docs/app/getting-started/metadata-and-og-images
// TODO: metadata: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
// TODO: metadata files: https://nextjs.org/docs/app/api-reference/file-conventions/metadata
// TODO: links: https://nextjs.org/docs/app/api-reference/components/link
// TODO: read current page path: https://nextjs.org/docs/app/api-reference/functions/use-pathname
// TODO: read url: https://nextjs.org/docs/app/api-reference/functions/use-search-params
// TODO: data fetching: https://nextjs.org/docs/app/guides/migrating/app-router-migration#step-6-migrating-data-fetching-methods

import { type Metadata } from 'next'
import { type ReactNode } from 'react'

import Footer from '@/ui/footer'
import Header from '@/ui/header'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Michael Uloth',
  description: 'Software engineer helping scientists discover new medicines at Recursion.',
}

type Props = Readonly<{
  children: ReactNode
}>

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" className="bg-accent">
      <body className="overflow-x-hidden bg-zinc-900 px-4 min-h-screen antialiased selection:bg-accent selection:text-black leading-relaxed text-[1.1rem] text-zinc-400">
        <div className="flex flex-col mx-auto max-w-prose min-h-screen">
          <Header />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  )
}

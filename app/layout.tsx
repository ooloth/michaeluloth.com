import { type ReactNode } from 'react'

import { metadata } from '@/seo/pages/base'
import '@/styles/globals.css'

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

export { metadata }

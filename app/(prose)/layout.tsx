import { type ReactNode } from 'react'
import Header from '@/ui/header'
import Footer from '@/ui/footer'

type Props = Readonly<{
  children: ReactNode
}>

export default function ProseLayout({ children }: Props) {
  return (
    <div className="flex flex-col mx-auto max-w-[45rem] w-full min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-black focus:rounded"
      >
        Skip to main content
      </a>
      <Header />
      {children}
      <Footer />
    </div>
  )
}

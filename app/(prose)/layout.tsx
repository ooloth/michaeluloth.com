import { type ReactNode } from 'react'
import Header from '@/ui/header'
import Footer from '@/ui/footer'

type Props = Readonly<{
  children: ReactNode
}>

export default function ProseLayout({ children }: Props) {
  return (
    <div className="flex flex-col mx-auto max-w-prose w-full min-h-screen">
      <Header />
      {children}
      <Footer />
    </div>
  )
}

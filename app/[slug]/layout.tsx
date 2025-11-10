import { type ReactNode } from 'react'

import Footer from '@/ui/footer'
import Header from '@/ui/header'

type Props = Readonly<{
  children: ReactNode
}>

export default function PostLayout({ children }: Props) {
  return (
    <div className="p-4">
      <div className="mx-auto max-w-prose">
        <Header />
        {children}
        <Footer />
      </div>
    </div>
  )
}

import { type ReactNode } from 'react'
import Header from '@/ui/header'
import Footer from '@/ui/footer'

type Props = Readonly<{
  children: ReactNode
}>

export default function LikesLayout({ children }: Props) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {children}
      <Footer />
    </div>
  )
}

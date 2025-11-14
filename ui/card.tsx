import { type ReactNode } from 'react'

type CardProps = Readonly<{
  href: string
  children: ReactNode
}>

export default function Card({ href, children }: CardProps) {
  return (
    <a href={href} className="shadow-2xl border border-zinc-700 hover:border-zinc-300 rounded-xl py-3 px-4">
      {children}
    </a>
  )
}

import { type ReactNode } from 'react'

type CardProps = Readonly<{
  content: ReactNode
  href: string
}>

export default function Card({ content, href }: CardProps) {
  return (
    <a href={href} className="shadow-2xl border border-zinc-700 hover:border-zinc-300 rounded-xl py-3 px-4">
      {content}
    </a>
  )
}

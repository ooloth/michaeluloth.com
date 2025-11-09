import { type ReactNode } from 'react'

type Props = Readonly<{
  children: ReactNode
}>

export default function PostLayout({ children }: Props) {
  return <div className="p-4">{children}</div>
}

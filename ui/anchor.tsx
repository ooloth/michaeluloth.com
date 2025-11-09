import Link from 'next/link'
import { type ReactNode } from 'react'

type Props = Readonly<{
  href: string
  children: ReactNode
}>

const className = 'text-blue-400 underline hover:text-blue-600'

export default function Anchor({ href, children }: Props) {
  const isInternalUrl = href.startsWith('/') || href.includes('michaeluloth.com')

  if (isInternalUrl) {
    const internalHref = href.includes('michaeluloth.com') ? href.replace('https://michaeluloth.com', '') : href

    return (
      <Link href={internalHref} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <a href={href} className={className} rel="noreferrer">
      {children}
    </a>
  )
}

import NextLink from 'next/link'
import { type ReactNode } from 'react'

type Props = Readonly<{
  ariaCurrent?: 'page'
  ariaLabel?: string
  href: string
  children: ReactNode
  className?: string
}>

export default function Link({ ariaCurrent, ariaLabel, href, children, className }: Props) {
  const isInternalUrl = href.startsWith('/') || href.includes('michaeluloth.com')
  const classes = className ? className : 'link'

  if (isInternalUrl) {
    // Relative, starting and ending with slash
    const internalHref = `/${href.replace('https://michaeluloth.com/', '')}/`.replace(/\/\/+/g, '/')

    return (
      <NextLink href={internalHref} aria-current={ariaCurrent} aria-label={ariaLabel} className={classes}>
        {children}
      </NextLink>
    )
  }

  return (
    <a href={href} className={classes} aria-label={ariaLabel} rel="noreferrer">
      {children}
    </a>
  )
}

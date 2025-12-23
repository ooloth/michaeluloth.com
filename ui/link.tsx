import NextLink from 'next/link'
import { type ReactNode } from 'react'

type Props = Readonly<{
  ariaCurrent?: 'page'
  ariaLabel?: string
  href: string
  children: ReactNode
  className?: string
}>

/**
 * Normalizes internal URLs to have leading and trailing slashes.
 * Removes domain if present, ensures consistent /path/ format.
 *
 * @example
 * normalizeInternalHref('/blog') // '/blog/'
 * normalizeInternalHref('blog/') // '/blog/'
 * normalizeInternalHref('https://michaeluloth.com/about') // '/about/'
 */
export function normalizeInternalHref(href: string): string {
  // Remove domain if present, then ensure leading and trailing slashes
  return `/${href.replace('https://michaeluloth.com/', '')}/`.replace(/\/\/+/g, '/')
}

export default function Link({ ariaCurrent, ariaLabel, href, children, className }: Props) {
  const isInternalUrl = href.startsWith('/') || href.includes('michaeluloth.com')
  const classes = className ? className : 'link'

  if (isInternalUrl) {
    const internalHref = normalizeInternalHref(href)

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

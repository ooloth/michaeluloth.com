import NextLink from 'next/link'
import { type ReactNode } from 'react'

type Props = Readonly<{
  ariaCurrent?: 'page'
  ariaLabel?: string
  href: string
  children: ReactNode
  className?: string
}>

const SITE_HOSTS: ReadonlySet<string> = new Set(['michaeluloth.com', 'www.michaeluloth.com'])

/** A root-relative path on this site, normalized to `/path/` with any query and hash after it. */
type InternalPath = string & { readonly __brand: 'InternalPath' }

type SiteHref = { kind: 'internal'; path: InternalPath } | { kind: 'external'; href: string }

/**
 * Ensures a root-relative path has leading and trailing slashes and no empty segments,
 * keeping any query and hash after the trailing slash.
 */
function toInternalPath(rootRelative: string): InternalPath {
  const suffixStart = rootRelative.search(/[?#]/)
  const pathname = suffixStart === -1 ? rootRelative : rootRelative.slice(0, suffixStart)
  const suffix = suffixStart === -1 ? '' : rootRelative.slice(suffixStart)
  const path = `/${pathname}/`.replace(/\/\/+/g, '/')

  if (!path.startsWith('/')) throw new Error(`Internal path must start with "/": ${path}`)
  if (!path.endsWith('/')) throw new Error(`Internal path must end with "/": ${path}`)
  if (path.includes('//')) throw new Error(`Internal path must not contain "//": ${path}`)

  return `${path}${suffix}` as InternalPath
}

/**
 * Decides whether an href points at this site. Root-relative paths and http(s) URLs whose host
 * is michaeluloth.com or www.michaeluloth.com are internal; everything else is returned unchanged.
 *
 * @example
 * classifyHref('/blog') // { kind: 'internal', path: '/blog/' }
 * classifyHref('http://www.michaeluloth.com/about') // { kind: 'internal', path: '/about/' }
 * classifyHref('https://github.com/ooloth/michaeluloth.com') // { kind: 'external', href: '...' }
 */
export function classifyHref(href: string): SiteHref {
  if (href.startsWith('/')) {
    return { kind: 'internal', path: toInternalPath(href) }
  }

  const url = URL.canParse(href) ? new URL(href) : null
  const isSiteUrl =
    url !== null && (url.protocol === 'https:' || url.protocol === 'http:') && SITE_HOSTS.has(url.hostname)

  return isSiteUrl
    ? { kind: 'internal', path: toInternalPath(`${url.pathname}${url.search}${url.hash}`) }
    : { kind: 'external', href }
}

export default function Link({ ariaCurrent, ariaLabel, href, children, className }: Props) {
  const siteHref = classifyHref(href)
  const classes = className ? className : 'link'

  if (siteHref.kind === 'internal') {
    const internalHref = siteHref.path

    // Disable viewport-based prefetching for heavy pages; otherwise use default behavior (prefetch in prod, not dev)
    const shouldPrefetch = internalHref === '/likes/' ? false : undefined

    return (
      <NextLink
        href={internalHref}
        prefetch={shouldPrefetch}
        aria-current={ariaCurrent}
        aria-label={ariaLabel}
        className={classes}
      >
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

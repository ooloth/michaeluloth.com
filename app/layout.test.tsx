/**
 * @vitest-environment happy-dom
 */

import { describe, expect, it } from 'vitest'
import { metadata } from './layout'
import { SITE_LOCALE, TWITTER_CARD } from '@/seo/constants'

describe('RootLayout metadata', () => {
  it('includes metadataBase', () => {
    expect(metadata.metadataBase).toEqual(new URL('https://michaeluloth.com/'))
  })

  it('includes title with template', () => {
    expect(metadata.title).toEqual({
      default: 'Michael Uloth',
      template: '%s • Michael Uloth',
    })
  })

  it('includes description', () => {
    expect(metadata.description).toBe('Software engineer helping scientists discover new medicines at Recursion.')
  })

  it('includes authors and creator', () => {
    expect(metadata.authors).toEqual([{ name: 'Michael Uloth' }])
    expect(metadata.creator).toBe('Michael Uloth')
  })

  it('includes OpenGraph config', () => {
    expect(metadata.openGraph).toEqual({
      type: 'website',
      locale: SITE_LOCALE,
      siteName: 'Michael Uloth',
      url: 'https://michaeluloth.com/',
      images: ['/og-image.png'],
    })
  })

  it('includes Twitter card config', () => {
    expect(metadata.twitter).toEqual({
      card: TWITTER_CARD,
      creator: '@ooloth',
    })
  })

  it('includes RSS feed link', () => {
    expect(metadata.alternates?.types).toEqual({
      'application/rss+xml': '/rss.xml',
    })
  })
})

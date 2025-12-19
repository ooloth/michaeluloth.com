/**
 * @vitest-environment happy-dom
 */

import { describe, expect, it } from 'vitest'
import { metadata } from './layout'

describe('RootLayout metadata', () => {
  it('includes basic site information', () => {
    expect(metadata.title).toBe('Michael Uloth')
    expect(metadata.description).toBe(
      'Software engineer helping scientists discover new medicines at Recursion.',
    )
  })

  it('includes RSS feed link', () => {
    expect(metadata.alternates?.types).toEqual({
      'application/rss+xml': '/rss.xml',
    })
  })

  it('includes sitemap link in head', () => {
    expect(metadata.icons?.other).toEqual([
      {
        rel: 'sitemap',
        type: 'application/xml',
        url: '/sitemap.xml',
      },
    ])
  })
})

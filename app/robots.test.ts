/**
 * @vitest-environment happy-dom
 */

import { describe, expect, it } from 'vitest'
import robots from './robots'

describe('robots', () => {
  it('allows all user agents to crawl all pages', () => {
    const config = robots()

    expect(config.rules).toEqual({
      userAgent: '*',
      allow: '/',
    })
  })

  it('references the sitemap location', () => {
    const config = robots()

    expect(config.sitemap).toBe('https://michaeluloth.com/sitemap.xml')
  })

  it('returns complete robots configuration', () => {
    const config = robots()

    expect(config).toEqual({
      rules: {
        userAgent: '*',
        allow: '/',
      },
      sitemap: 'https://michaeluloth.com/sitemap.xml',
    })
  })
})

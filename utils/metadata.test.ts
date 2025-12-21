import { describe, it, expect } from 'vitest'
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_AUTHOR,
  DEFAULT_OG_IMAGE,
  SITE_URL,
} from './metadata'

describe('metadata constants', () => {
  it('exports site name', () => {
    expect(SITE_NAME).toBe('Michael Uloth')
  })

  it('exports site description', () => {
    expect(SITE_DESCRIPTION).toBe(
      'Software engineer helping scientists discover new medicines at Recursion.',
    )
  })

  it('exports site author', () => {
    expect(SITE_AUTHOR).toBe('Michael Uloth')
  })

  it('exports default OG image path', () => {
    expect(DEFAULT_OG_IMAGE).toBe('/og-image.png')
  })

  it('exports site URL', () => {
    expect(SITE_URL).toBe('https://michaeluloth.com/')
  })
})

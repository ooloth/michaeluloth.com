import { describe, it, expect } from 'vitest'
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_AUTHOR,
  DEFAULT_OG_IMAGE,
  SITE_URL,
} from './metadata'

describe('metadata constants', () => {
  describe('SITE_NAME', () => {
    it('exports site name', () => {
      expect(SITE_NAME).toBe('Michael Uloth')
    })

    it('is a non-empty string', () => {
      expect(typeof SITE_NAME).toBe('string')
      expect(SITE_NAME.length).toBeGreaterThan(0)
    })
  })

  describe('SITE_DESCRIPTION', () => {
    it('exports site description', () => {
      expect(SITE_DESCRIPTION).toBe(
        'Software engineer helping scientists discover new medicines at Recursion.',
      )
    })

    it('is a non-empty string', () => {
      expect(typeof SITE_DESCRIPTION).toBe('string')
      expect(SITE_DESCRIPTION.length).toBeGreaterThan(0)
    })
  })

  describe('SITE_AUTHOR', () => {
    it('exports site author name', () => {
      expect(SITE_AUTHOR).toBe('Michael Uloth')
    })

    it('is a non-empty string', () => {
      expect(typeof SITE_AUTHOR).toBe('string')
      expect(SITE_AUTHOR.length).toBeGreaterThan(0)
    })
  })

  describe('DEFAULT_OG_IMAGE', () => {
    it('exports default OG image path', () => {
      expect(DEFAULT_OG_IMAGE).toBe('/og-image.png')
    })

    it('is a valid path string', () => {
      expect(typeof DEFAULT_OG_IMAGE).toBe('string')
      expect(DEFAULT_OG_IMAGE).toMatch(/^\//)
      expect(DEFAULT_OG_IMAGE.length).toBeGreaterThan(0)
    })
  })

  describe('SITE_URL', () => {
    it('exports site URL', () => {
      expect(SITE_URL).toBe('https://michaeluloth.com/')
    })

    it('is a valid URL with trailing slash', () => {
      expect(typeof SITE_URL).toBe('string')
      expect(SITE_URL).toMatch(/^https:\/\//)
      expect(SITE_URL).toMatch(/\/$/)
    })
  })
})

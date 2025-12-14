import { isCloudinaryUrl } from './validation'

describe('isCloudinaryUrl', () => {
  describe('valid Cloudinary URLs', () => {
    it('accepts null values', () => {
      expect(isCloudinaryUrl(null)).toBe(true)
    })

    it('accepts Cloudinary URLs in mu/ folder', () => {
      const url = 'https://res.cloudinary.com/ooloth/image/upload/mu/test-image.jpg'
      expect(isCloudinaryUrl(url)).toBe(true)
    })

    it('accepts Cloudinary URLs in fetch/ folder', () => {
      const url = 'https://res.cloudinary.com/ooloth/image/fetch/https://example.com/image.jpg'
      expect(isCloudinaryUrl(url)).toBe(true)
    })

    it('accepts Cloudinary URLs with version numbers', () => {
      const url = 'https://res.cloudinary.com/ooloth/image/upload/v1646239412/mu/test-image.jpg'
      expect(isCloudinaryUrl(url)).toBe(true)
    })

    it('accepts Cloudinary URLs with subfolders in mu/', () => {
      const url = 'https://res.cloudinary.com/ooloth/image/upload/mu/subfolder/test-image.jpg'
      expect(isCloudinaryUrl(url)).toBe(true)
    })
  })

  describe('invalid URLs', () => {
    it('rejects non-Cloudinary URLs', () => {
      const url = 'https://example.com/image.jpg'
      expect(isCloudinaryUrl(url)).toBe(false)
    })

    it('rejects malicious URLs with cloudinary in path but wrong domain', () => {
      const url = 'https://evil.com/cloudinary/mu/image.jpg'
      expect(isCloudinaryUrl(url)).toBe(false)
    })

    it('rejects Cloudinary URLs not in mu/ or fetch/ folders', () => {
      const url = 'https://res.cloudinary.com/ooloth/image/upload/other-folder/image.jpg'
      expect(isCloudinaryUrl(url)).toBe(false)
    })

    it('rejects URLs that only contain "mu" but not "/mu/"', () => {
      const url = 'https://res.cloudinary.com/ooloth/image/upload/museum/image.jpg'
      expect(isCloudinaryUrl(url)).toBe(false)
    })

    it('rejects URLs that only contain "fetch" but not "/fetch/"', () => {
      const url = 'https://res.cloudinary.com/ooloth/image/upload/fetching/image.jpg'
      expect(isCloudinaryUrl(url)).toBe(false)
    })

    it('rejects empty strings', () => {
      expect(isCloudinaryUrl('')).toBe(false)
    })

    it('rejects malformed URLs', () => {
      const url = 'not-a-valid-url'
      expect(isCloudinaryUrl(url)).toBe(false)
    })
  })
})

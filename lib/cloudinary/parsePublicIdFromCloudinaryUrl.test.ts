import parsePublicIdFromCloudinaryUrl, { ERRORS } from './parsePublicIdFromCloudinaryUrl'

describe('parsePublicIdFromCloudinaryUrl', () => {
  describe('success cases', () => {
    it('parses public ID from standard mu/ upload URL', () => {
      const url = 'https://res.cloudinary.com/ooloth/image/upload/v1646239412/mu/be-careful-austin-distel.jpg'
      const result = parsePublicIdFromCloudinaryUrl(url)

      expect(result).toBe('mu/be-careful-austin-distel')
    })

    it('parses public ID from fetch/ URL', () => {
      const url = 'https://res.cloudinary.com/ooloth/image/fetch/https://media.giphy.com/media/l0HlGPNqhq07VzPeU/giphy.gif'
      const result = parsePublicIdFromCloudinaryUrl(url)

      expect(result).toBe('https://media.giphy.com/media/l0HlGPNqhq07VzPeU/giphy.gif')
    })

    it('removes file extension from mu/ images', () => {
      const url = 'https://res.cloudinary.com/ooloth/image/upload/mu/test-image.png'
      const result = parsePublicIdFromCloudinaryUrl(url)

      expect(result).toBe('mu/test-image')
    })

    it('handles multiple dots in filename', () => {
      const url = 'https://res.cloudinary.com/ooloth/image/upload/mu/test.image.multiple.dots.jpg'
      const result = parsePublicIdFromCloudinaryUrl(url)

      expect(result).toBe('mu/test.image.multiple.dots')
    })

    it('handles mu/ image without extension', () => {
      const url = 'https://res.cloudinary.com/ooloth/image/upload/mu/test-image'
      const result = parsePublicIdFromCloudinaryUrl(url)

      expect(result).toBe('mu/test-image')
    })

    it('does not remove extension from fetch/ URLs', () => {
      const url = 'https://res.cloudinary.com/ooloth/image/fetch/https://example.com/image.jpg'
      const result = parsePublicIdFromCloudinaryUrl(url)

      expect(result).toBe('https://example.com/image.jpg')
    })

    it('handles mu/ in different parts of URL', () => {
      const url = 'https://res.cloudinary.com/ooloth/image/upload/v1234567890/mu/subfolder/image.jpg'
      const result = parsePublicIdFromCloudinaryUrl(url)

      expect(result).toBe('mu/subfolder/image')
    })
  })

  describe('error cases', () => {
    it('throws Error when url is not a Cloudinary URL', () => {
      const url = 'https://example.com/image.jpg'

      expect(() => parsePublicIdFromCloudinaryUrl(url)).toThrow(Error)
      expect(() => parsePublicIdFromCloudinaryUrl(url)).toThrow(ERRORS.NOT_CLOUDINARY_URL)
    })

    it('throws Error when Cloudinary URL does not contain mu/ or fetch/', () => {
      const url = 'https://res.cloudinary.com/ooloth/image/upload/some-other-folder/image.jpg'

      expect(() => parsePublicIdFromCloudinaryUrl(url)).toThrow(Error)
      expect(() => parsePublicIdFromCloudinaryUrl(url)).toThrow(ERRORS.INVALID_FOLDER)
    })

    it('includes url in error message for non-cloudinary URL', () => {
      const url = 'https://example.com/image.jpg'

      expect(() => parsePublicIdFromCloudinaryUrl(url)).toThrow('but was: https://example.com/image.jpg')
    })

    it('includes url in error message for invalid folder', () => {
      const url = 'https://res.cloudinary.com/ooloth/image/upload/wrong/image.jpg'

      expect(() => parsePublicIdFromCloudinaryUrl(url)).toThrow('but was: https://res.cloudinary.com/ooloth/image/upload/wrong/image.jpg')
    })
  })

  describe('edge cases', () => {
    it('removes extension along with query parameters for mu/ images', () => {
      const url = 'https://res.cloudinary.com/ooloth/image/upload/mu/test-image.jpg?v=123'
      const result = parsePublicIdFromCloudinaryUrl(url)

      // Extension removal strips everything after the last dot, including query params
      expect(result).toBe('mu/test-image')
    })

    it('removes extension along with hash fragments for mu/ images', () => {
      const url = 'https://res.cloudinary.com/ooloth/image/upload/mu/test-image.jpg#section'
      const result = parsePublicIdFromCloudinaryUrl(url)

      // Extension removal strips everything after the last dot, including hash
      expect(result).toBe('mu/test-image')
    })
  })
})

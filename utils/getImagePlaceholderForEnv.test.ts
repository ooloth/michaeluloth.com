import getImagePlaceholderForEnv, { ERRORS } from './getImagePlaceholderForEnv'

// Mock plaiceholder (vi is globally available)
vi.mock('plaiceholder', () => ({
  getPlaiceholder: vi.fn(async () => ({
    base64: 'data:image/png;base64,mockedBase64String',
  })),
}))

// Mock global fetch - returns a minimal Response with arrayBuffer method
const mockArrayBuffer = vi.fn(async () => new ArrayBuffer(8))
global.fetch = vi.fn(async () => ({ arrayBuffer: mockArrayBuffer }))

describe('getImagePlaceholderForEnv', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('returns gray pixel placeholder in development', async () => {
    vi.stubEnv('NODE_ENV', 'development')

    const result = await getImagePlaceholderForEnv('https://example.com/image.jpg', 16)

    expect(result).toBe(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOUkJD+DwAB5wFMR598EAAAAABJRU5ErkJggg==',
    )
  })

  it('calls plaiceholder in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    const { getPlaiceholder } = await import('plaiceholder')
    const result = await getImagePlaceholderForEnv('https://example.com/image.jpg', 16)

    // getPlaiceholder should be called with a Buffer (from fetch), not the URL string
    expect(getPlaiceholder).toHaveBeenCalledWith(expect.any(Buffer), { size: 16 })
    expect(result).toBe('data:image/png;base64,mockedBase64String')
  })

  it('uses default size of 4 when not specified', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    const { getPlaiceholder } = await import('plaiceholder')
    await getImagePlaceholderForEnv('https://example.com/image.jpg')

    expect(getPlaiceholder).toHaveBeenCalledWith(expect.any(Buffer), { size: 4 })
  })

  it('throws error if size is less than 4', async () => {
    await expect(getImagePlaceholderForEnv('https://example.com/image.jpg', 3)).rejects.toThrow(ERRORS.INVALID_SIZE)
  })

  it('throws error if size is greater than 64', async () => {
    await expect(getImagePlaceholderForEnv('https://example.com/image.jpg', 65)).rejects.toThrow(ERRORS.INVALID_SIZE)
  })

  describe('production error handling', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production')
    })

    it('throws when fetch fails with network error', async () => {
      const networkError = new Error('Network request failed')
      global.fetch = vi.fn().mockRejectedValue(networkError)

      await expect(getImagePlaceholderForEnv('https://example.com/image.jpg')).rejects.toThrow('Network request failed')
    })

    it('throws when fetch returns 404', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('404 Not Found'))

      await expect(getImagePlaceholderForEnv('https://example.com/broken-image.jpg')).rejects.toThrow('404 Not Found')
    })

    it('throws when fetch returns 500', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('500 Internal Server Error'))

      await expect(getImagePlaceholderForEnv('https://example.com/image.jpg')).rejects.toThrow(
        '500 Internal Server Error',
      )
    })

    it('throws when arrayBuffer() fails', async () => {
      const arrayBufferError = new Error('Failed to read response body')
      global.fetch = vi.fn().mockResolvedValue({
        arrayBuffer: vi.fn().mockRejectedValue(arrayBufferError),
      })

      await expect(getImagePlaceholderForEnv('https://example.com/image.jpg')).rejects.toThrow(
        'Failed to read response body',
      )
    })

    it('throws when plaiceholder fails with corrupted image', async () => {
      const { getPlaiceholder } = await import('plaiceholder')

      // Mock successful fetch but plaiceholder failure
      const mockArrayBuffer = vi.fn(async () => new ArrayBuffer(8))
      global.fetch = vi.fn(async () => ({ arrayBuffer: mockArrayBuffer }))

      const plaiceholderError = new Error('Input buffer contains unsupported image format')
      vi.mocked(getPlaiceholder).mockRejectedValue(plaiceholderError)

      await expect(getImagePlaceholderForEnv('https://example.com/corrupt.jpg')).rejects.toThrow(
        'Input buffer contains unsupported image format',
      )
    })

    it('throws when plaiceholder fails with unsupported format', async () => {
      const { getPlaiceholder } = await import('plaiceholder')

      const mockArrayBuffer = vi.fn(async () => new ArrayBuffer(8))
      global.fetch = vi.fn(async () => ({ arrayBuffer: mockArrayBuffer }))

      const unsupportedError = new Error('Unsupported image type')
      vi.mocked(getPlaiceholder).mockRejectedValue(unsupportedError)

      await expect(getImagePlaceholderForEnv('https://example.com/image.tiff')).rejects.toThrow(
        'Unsupported image type',
      )
    })

    it('throws when plaiceholder fails with invalid dimensions', async () => {
      const { getPlaiceholder } = await import('plaiceholder')

      const mockArrayBuffer = vi.fn(async () => new ArrayBuffer(8))
      global.fetch = vi.fn(async () => ({ arrayBuffer: mockArrayBuffer }))

      const dimensionError = new Error('Image dimensions are too large')
      vi.mocked(getPlaiceholder).mockRejectedValue(dimensionError)

      await expect(getImagePlaceholderForEnv('https://example.com/huge-image.jpg')).rejects.toThrow(
        'Image dimensions are too large',
      )
    })

    it('creates Buffer correctly from fetch response', async () => {
      const { getPlaiceholder } = await import('plaiceholder')

      // Create a realistic ArrayBuffer
      const imageData = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]) // JPEG header
      const mockArrayBuffer = vi.fn(async () => imageData.buffer)
      global.fetch = vi.fn(async () => ({ arrayBuffer: mockArrayBuffer }))

      vi.mocked(getPlaiceholder).mockResolvedValue({
        base64: 'data:image/png;base64,test',
      } as Awaited<ReturnType<typeof getPlaiceholder>>)

      await getImagePlaceholderForEnv('https://example.com/image.jpg', 8)

      // Verify Buffer.from was called with the ArrayBuffer
      expect(getPlaiceholder).toHaveBeenCalledWith(expect.any(Buffer), { size: 8 })

      // Verify the Buffer contains the image data
      const callArgs = vi.mocked(getPlaiceholder).mock.calls[0]
      const buffer = callArgs[0] as Buffer
      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBe(4)
      expect(buffer[0]).toBe(0xff)
      expect(buffer[1]).toBe(0xd8)
    })

    it('handles timeout when fetching remote image', async () => {
      const timeoutError = new Error('Request timeout')
      global.fetch = vi.fn().mockRejectedValue(timeoutError)

      await expect(getImagePlaceholderForEnv('https://slow-server.com/image.jpg')).rejects.toThrow('Request timeout')
    })

    it('throws with helpful error when image URL is invalid', async () => {
      const invalidUrlError = new Error('Invalid URL')
      global.fetch = vi.fn().mockRejectedValue(invalidUrlError)

      await expect(getImagePlaceholderForEnv('not-a-valid-url')).rejects.toThrow('Invalid URL')
    })
  })
})

import getImagePlaceholderForEnv from './getImagePlaceholderForEnv'

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
    await expect(getImagePlaceholderForEnv('https://example.com/image.jpg', 3)).rejects.toThrow(
      '[getImagePlaceholderForEnv]: size argument must be an integer between 4 and 64',
    )
  })

  it('throws error if size is greater than 64', async () => {
    await expect(getImagePlaceholderForEnv('https://example.com/image.jpg', 65)).rejects.toThrow(
      '[getImagePlaceholderForEnv]: size argument must be an integer between 4 and 64',
    )
  })
})

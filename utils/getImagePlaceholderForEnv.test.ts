import getImagePlaceholderForEnv from './getImagePlaceholderForEnv'

// Mock plaiceholder (vi is globally available)
vi.mock('plaiceholder', () => ({
  getPlaiceholder: vi.fn(async () => ({
    base64: 'data:image/png;base64,mockedBase64String',
  })),
}))

describe('getImagePlaceholderForEnv', () => {
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  it('returns gray pixel placeholder in development', async () => {
    process.env.NODE_ENV = 'development'
    const result = await getImagePlaceholderForEnv('https://example.com/image.jpg', 16)

    expect(result).toBe(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOUkJD+DwAB5wFMR598EAAAAABJRU5ErkJggg==',
    )
  })

  it('calls plaiceholder in production', async () => {
    process.env.NODE_ENV = 'production'
    const { getPlaiceholder } = await import('plaiceholder')

    const result = await getImagePlaceholderForEnv('https://example.com/image.jpg', 16)

    expect(getPlaiceholder).toHaveBeenCalledWith('https://example.com/image.jpg', { size: 16 })
    expect(result).toBe('data:image/png;base64,mockedBase64String')
  })

  it('uses default size of 4 when not specified', async () => {
    process.env.NODE_ENV = 'production'
    const { getPlaiceholder } = await import('plaiceholder')

    await getImagePlaceholderForEnv('https://example.com/image.jpg')

    expect(getPlaiceholder).toHaveBeenCalledWith('https://example.com/image.jpg', { size: 4 })
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

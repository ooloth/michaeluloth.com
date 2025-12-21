import { transformCloudinaryForOG } from './ogImageTransforms'

describe('transformCloudinaryForOG', () => {
  it('transforms Cloudinary upload URLs with OG dimensions', () => {
    const input = 'https://res.cloudinary.com/ooloth/image/upload/v1703127894/mu/u-turn.jpg'
    const result = transformCloudinaryForOG(input)
    expect(result).toBe('https://res.cloudinary.com/ooloth/image/upload/c_fill,w_1200,h_630/v1703127894/mu/u-turn.jpg')
  })

  it('transforms Cloudinary upload URLs without version', () => {
    const input = 'https://res.cloudinary.com/demo/upload/sample.jpg'
    const result = transformCloudinaryForOG(input)
    expect(result).toBe('https://res.cloudinary.com/demo/upload/c_fill,w_1200,h_630/sample.jpg')
  })

  it('transforms Cloudinary URLs with existing transformations', () => {
    const input = 'https://res.cloudinary.com/ooloth/image/upload/f_auto/v123/mu/photo.jpg'
    const result = transformCloudinaryForOG(input)
    expect(result).toBe('https://res.cloudinary.com/ooloth/image/upload/c_fill,w_1200,h_630/f_auto/v123/mu/photo.jpg')
  })

  it('returns non-Cloudinary URLs unchanged', () => {
    const input = 'https://example.com/image.jpg'
    const result = transformCloudinaryForOG(input)
    expect(result).toBe(input)
  })

  it('returns local URLs unchanged', () => {
    const input = '/og-image.png'
    const result = transformCloudinaryForOG(input)
    expect(result).toBe(input)
  })

  it('returns absolute site URLs unchanged', () => {
    const input = 'https://michaeluloth.com/og-image.png'
    const result = transformCloudinaryForOG(input)
    expect(result).toBe(input)
  })
})

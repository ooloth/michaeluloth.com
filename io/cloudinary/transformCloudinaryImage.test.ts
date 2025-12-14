import transformCloudinaryImage from './transformCloudinaryImage'

describe('transformCloudinaryImage', () => {
  it('transforms upload URLs with optimization parameters', () => {
    const input = 'https://res.cloudinary.com/demo/upload/sample.jpg'
    const result = transformCloudinaryImage(input, 400)
    expect(result).toBe('https://res.cloudinary.com/demo/upload/w_400,f_auto,q_auto,dpr_2.0/sample.jpg')
  })

  it('transforms fetch URLs with optimization parameters', () => {
    const input = 'https://res.cloudinary.com/demo/fetch/https://example.com/image.jpg'
    const result = transformCloudinaryImage(input, 192)
    expect(result).toBe(
      'https://res.cloudinary.com/demo/fetch/w_192,f_auto,q_auto,dpr_2.0/https://example.com/image.jpg',
    )
  })

  it('transforms youtube URLs with optimization parameters', () => {
    const input = 'https://res.cloudinary.com/demo/youtube/abc123.jpg'
    const result = transformCloudinaryImage(input, 640)
    expect(result).toBe('https://res.cloudinary.com/demo/youtube/w_640,f_auto,q_auto,dpr_2.0/abc123.jpg')
  })

  it('returns URL unchanged if not a Cloudinary URL', () => {
    const input = 'https://example.com/image.jpg'
    const result = transformCloudinaryImage(input, 400)
    expect(result).toBe(input)
  })

  it('returns URL unchanged if Cloudinary URL but no known transformation type', () => {
    const input = 'https://res.cloudinary.com/demo/image.jpg'
    const result = transformCloudinaryImage(input, 400)
    expect(result).toBe(input)
  })
})

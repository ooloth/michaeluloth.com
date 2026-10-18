import cloudinary from './client'

describe('Cloudinary client', () => {
  it('hides credentials from the errors the SDK raises', () => {
    expect(cloudinary.config().hide_sensitive).toBe(true)
  })
})

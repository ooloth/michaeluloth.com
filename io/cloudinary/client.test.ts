import cloudinary from './client'

describe('Cloudinary client', () => {
  it("turns on the SDK's hide_sensitive option", () => {
    expect(cloudinary.config().hide_sensitive).toBe(true)
  })
})

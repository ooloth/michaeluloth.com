/**
 * Transforms a Cloudinary URL to specific dimensions for OpenGraph images.
 * Adds c_fill,w_1200,h_630 transformation to match OG image requirements.
 *
 * @param url - Original Cloudinary URL
 * @returns Transformed URL with OG dimensions, or original URL if not Cloudinary
 *
 * @example
 * transformCloudinaryForOG('https://res.cloudinary.com/ooloth/image/upload/v123/mu/image.jpg')
 * // Returns: 'https://res.cloudinary.com/ooloth/image/upload/c_fill,w_1200,h_630/v123/mu/image.jpg'
 */
export function transformCloudinaryForOG(url: string): string {
  // Only transform Cloudinary URLs
  if (!url.includes('res.cloudinary.com')) {
    return url
  }

  // Insert OG transformation parameters after /upload/
  return url.replace(
    '/upload/',
    '/upload/c_fill,w_1200,h_630/',
  )
}

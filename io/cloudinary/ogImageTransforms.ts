/**
 * OpenGraph image dimensions as recommended by social platforms.
 * @see https://ogp.me/#structured
 */
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

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
  const transform = `c_fill,w_${OG_IMAGE_WIDTH},h_${OG_IMAGE_HEIGHT}`
  return url.replace('/upload/', `/upload/${transform}/`)
}

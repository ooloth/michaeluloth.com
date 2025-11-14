/**
 * Parses the public ID from a Cloudinary URL.
 * Assumes the image is stored in the "mu/" or "fetch/" folder.
 *
 * Example URL: https://res.cloudinary.com/ooloth/image/upload/v1646239412/mu/be-careful-austin-distel.jpg
 * Example public ID: mu/be-careful-austin-distel
 *
 * Example URL: https://res.cloudinary.com/ooloth/image/fetch/https://media.giphy.com/media/l0HlGPNqhq07VzPeU/giphy.gif
 * Example public ID: https://media.giphy.com/media/l0HlGPNqhq07VzPeU/giphy
 *
 * @throws {TypeError} If the input is not a string.
 * @throws {Error} If the URL is not a valid Cloudinary URL or is not in the "mu/" folder.
 */
export default function parsePublicIdFromCloudinaryUrl(url: string): string | null {
  if (typeof url !== 'string') {
    throw new TypeError(`URL must be a string, but was ${typeof url}: ${url}`)
  }

  if (!url.includes('cloudinary')) {
    throw new Error(`URL must be a Cloudinary URL, but was: ${url}`)
  }

  if (!url.includes('/mu/') && !url.includes('/fetch/')) {
    throw new Error(`Cloudinary URL image must be in the "mu/" or "fetch/" folders, but was: ${url}`)
  }

  const muPublicIdStart = url.indexOf('/mu/')
  const fetchPublicIdStart = url.indexOf('/fetch/')

  if (muPublicIdStart === -1 && fetchPublicIdStart === -1) {
    throw new Error(`Failed to parse Public ID from Cloudinary URL: ${url}`)
  }

  const publicIdStart =
    muPublicIdStart !== -1
      ? muPublicIdStart + 1 // +1 to include "mu/"
      : fetchPublicIdStart + 7 // +7 to exclude "/fetch/"

  if (publicIdStart === -1) {
    return null
  }

  const publicIdAndExtension = url.substring(publicIdStart)

  return publicIdAndExtension.startsWith('mu/') ? removeFileExtension(publicIdAndExtension) : publicIdAndExtension
}

const removeFileExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf('.')
  if (lastDotIndex === -1) {
    return filename // No extension found
  }
  return filename.substring(0, lastDotIndex)
}

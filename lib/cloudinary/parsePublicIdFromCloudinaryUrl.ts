export const ERRORS = {
  NOT_A_STRING: (url: unknown) => `URL must be a string, but was ${typeof url}: ${url}`,
  NOT_CLOUDINARY_URL: (url: string) => `URL must be a Cloudinary URL, but was: ${url}`,
  INVALID_FOLDER: (url: string) => `Cloudinary URL image must be in the "mu/" or "fetch/" folders, but was: ${url}`,
  PARSE_FAILED: (url: string) => `Failed to parse Public ID from Cloudinary URL: ${url}`,
} as const

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
    throw new TypeError(ERRORS.NOT_A_STRING(url))
  }

  if (!url.includes('cloudinary')) {
    throw new Error(ERRORS.NOT_CLOUDINARY_URL(url))
  }

  if (!url.includes('/mu/') && !url.includes('/fetch/')) {
    throw new Error(ERRORS.INVALID_FOLDER(url))
  }

  const muPublicIdStart = url.indexOf('/mu/')
  const fetchPublicIdStart = url.indexOf('/fetch/')

  if (muPublicIdStart === -1 && fetchPublicIdStart === -1) {
    throw new Error(ERRORS.PARSE_FAILED(url))
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

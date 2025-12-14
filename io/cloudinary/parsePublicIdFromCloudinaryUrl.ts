export const ERRORS = {
  NOT_CLOUDINARY_URL: 'URL must be a Cloudinary URL',
  INVALID_FOLDER: 'Cloudinary URL image must be in the "mu/" or "fetch/" folders',
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
 * @param url - Cloudinary URL (validated as string by TypeScript and Zod)
 * @throws {Error} If the URL is not a Cloudinary URL or is not in the "mu/" or "fetch/" folders
 */
export default function parsePublicIdFromCloudinaryUrl(url: string): string {
  if (!url.includes('cloudinary')) {
    throw new Error(`${ERRORS.NOT_CLOUDINARY_URL}, but was: ${url}`)
  }

  if (!url.includes('/mu/') && !url.includes('/fetch/')) {
    throw new Error(`${ERRORS.INVALID_FOLDER}, but was: ${url}`)
  }

  const muPublicIdStart = url.indexOf('/mu/')
  const fetchPublicIdStart = url.indexOf('/fetch/')

  const publicIdStart =
    muPublicIdStart !== -1
      ? muPublicIdStart + 1 // +1 to include "mu/"
      : fetchPublicIdStart + 7 // +7 to exclude "/fetch/"

  const publicIdAndExtension = url.substring(publicIdStart)

  return publicIdAndExtension.startsWith('mu/') ? removeFileExtension(publicIdAndExtension) : publicIdAndExtension
}

/**
 * Removes file extension from a filename.
 * Intentionally removes query parameters and URL fragments as well,
 * since they appear after the extension (e.g., "image.jpg?v=123#anchor" becomes "image").
 *
 * @param filename - Filename or path to process
 * @returns Filename without extension, query params, or fragments
 */
const removeFileExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf('.')
  if (lastDotIndex === -1) {
    return filename // No extension found
  }
  return filename.substring(0, lastDotIndex)
}

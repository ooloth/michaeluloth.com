/**
 * Parses the public ID from a Cloudinary URL.
 * Assumes the image is stored in the "mu/" folder.
 *
 * Example URL: https://res.cloudinary.com/ooloth/image/upload/v1646239412/mu/be-careful-austin-distel.jpg
 * Example public ID: mu/be-careful-austin-distel
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

  if (!url.includes('/mu/')) {
    throw new Error(`Cloudinary URL image must be in the "mu/" folder, but was: ${url}`)
  }

  // Assume public ID will always starts with "mu/"
  const publicIdStart = url.indexOf('/mu/')
  if (publicIdStart === -1) {
    return null
  }

  // Extract the substring starting from "mu/"
  const publicIdAndExtension = url.substring(publicIdStart + 1) // +1 to remove leading slash

  // Find the last dot to identify the file extension
  const lastDotIndex = publicIdAndExtension.lastIndexOf('.')
  if (lastDotIndex === -1) {
    return publicIdAndExtension // No extension found
  }

  // Remove the file extension
  const publicId = publicIdAndExtension.substring(0, lastDotIndex)

  return publicId
}

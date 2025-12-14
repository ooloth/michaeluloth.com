/**
 * Validates Cloudinary URL structure.
 * Must be from res.cloudinary.com domain and be in '/mu/' or '/fetch/' folders.
 *
 * @param url - URL string to validate (null is allowed for optional URLs)
 * @returns true if URL is null or a valid Cloudinary URL in mu/ or fetch/ folders
 */
export function isCloudinaryUrl(url: string | null): boolean {
  if (url === null) return true // null is allowed for optional URLs
  if (url === '') return false // empty strings are not valid URLs

  try {
    const parsedUrl = new URL(url)
    return parsedUrl.hostname === 'res.cloudinary.com' && (url.includes('/mu/') || url.includes('/fetch/'))
  } catch {
    return false // Invalid URL format
  }
}

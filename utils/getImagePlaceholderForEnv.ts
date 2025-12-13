import { getPlaiceholder, type GetPlaiceholderSrc } from 'plaiceholder'

export const ERRORS = {
  INVALID_SIZE: '[getImagePlaceholderForEnv]: size argument must be an integer between 4 and 64',
} as const

/**
 * Generates image placeholders with environment-aware behavior.
 * Production: generates actual base64 placeholders from image URLs using plaiceholder.
 * Development: returns lightweight gray pixel placeholder for faster builds.
 *
 * @param imageUrl - The image URL to generate placeholder for
 * @param size - Placeholder size (must be between 4 and 64)
 */
export default async function getImagePlaceholderForEnv(imageUrl: string, size: number = 4): Promise<string> {
  // Validate size argument
  if ((size && size < 4) || (size && size > 64)) {
    throw Error(ERRORS.INVALID_SIZE)
  }

  if (process.env.NODE_ENV === 'production') {
    // Generate a real placeholder in production
    // plaiceholder v3 requires a Buffer, not a URL string
    const buffer = await fetch(imageUrl).then(async res => Buffer.from(await res.arrayBuffer()))
    const { base64 } = await getPlaiceholder(buffer, { size })
    return base64
  } else {
    // Make development faster by using a fake placeholder
    return gray900AsBase64
  }
}

// See: https://png-pixel.com
const gray900AsBase64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOUkJD+DwAB5wFMR598EAAAAABJRU5ErkJggg=='

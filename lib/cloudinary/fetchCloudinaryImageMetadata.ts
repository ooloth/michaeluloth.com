import { filesystemCache, type CacheAdapter } from '@/lib/cache/adapter'
import cloudinary, { type CloudinaryClient } from '@/lib/cloudinary/client'
import { getErrorDetails } from '@/utils/logging'
import { formatValidationError } from '@/utils/zod'
import parsePublicIdFromCloudinaryUrl from './parsePublicIdFromCloudinaryUrl'
import { Ok, toErr, type Result } from '@/utils/result'
import { z } from 'zod'

export const ERRORS = {
  PARSE_PUBLIC_ID_FAILED: (url: string) => `🚨 Could not parse Cloudinary public ID from URL: "${url}"`,
  INVALID_API_RESPONSE: (publicId: string, errors: string) =>
    `🚨 Invalid Cloudinary API response for "${publicId}": ${errors}`,
} as const

export type CloudinaryImageMetadata = {
  alt: string
  caption: string
  height: number
  sizes: string
  src: string
  srcSet: string
  width: number
}

/**
 * Schema for CloudinaryImageMetadata
 * Validates the cached metadata structure
 */
const CloudinaryImageMetadataSchema = z.object({
  alt: z.string(),
  caption: z.string(),
  height: z.number(),
  sizes: z.string(),
  src: z.string(),
  srcSet: z.string(),
  width: z.number(),
}) satisfies z.ZodType<CloudinaryImageMetadata>

type Options = {
  url: string
  cache?: CacheAdapter
  cloudinaryClient?: CloudinaryClient
}

/**
 * Schema for Cloudinary API resource response
 * Validates the parts of CloudinaryResource that we actually use
 */
const CloudinaryResourceSchema = z.object({
  public_id: z.string(),
  width: z.number(),
  height: z.number(),
  context: z
    .object({
      custom: z
        .object({
          alt: z.string().optional(),
          caption: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
})

/**
 * Generates responsive image URLs for Cloudinary images.
 * Pure function - testable without I/O.
 *
 * @param publicId - Cloudinary public ID
 * @param cloudinaryClient - Cloudinary client instance
 * @returns Object with src, srcSet, and sizes strings for responsive images
 */
export function generateResponsiveImageUrls(
  publicId: string,
  cloudinaryClient: CloudinaryClient,
): { src: string; srcSet: string; sizes: string } {
  const widths = [
    350, // image layout width on phone at 1x DPR
    700, // image layout width on phone at 2x DPR
    850,
    1020,
    1200, // image layout width on phone at 3x DPR
    1440, // max image layout width at 2x DPR (skipped 1x since 700px is already included above)
    1680,
    1920,
    2160, // max image layout width at 3x DPR
  ]

  const baseOptions = {
    crop: 'scale',
    fetch_format: 'auto',
    quality: 'auto',
  } as const

  const src = cloudinaryClient.url(publicId, { ...baseOptions, width: 1440 })

  const srcSet = widths
    .map(width => `${cloudinaryClient.url(publicId, { ...baseOptions, width })} ${width}w`)
    .join(', ')

  const sizes = '(min-width: 768px) 768px, 100vw'

  return { src, srcSet, sizes }
}

/**
 * Fetches Cloudinary image metadata including alt text, caption, dimensions, and responsive image attributes.
 *
 * @see https://cloudinary.com/documentation/admin_api#get_details_of_a_single_resource_by_public_id
 */
export default async function fetchCloudinaryImageMetadata({
  url,
  cache = filesystemCache,
  cloudinaryClient = cloudinary,
}: Options): Promise<Result<CloudinaryImageMetadata, Error>> {
  try {
    const publicId = parsePublicIdFromCloudinaryUrl(url)
    if (!publicId) {
      throw new Error(ERRORS.PARSE_PUBLIC_ID_FAILED(url))
    }

    // Check cache first (dev mode only)
    const cached = await cache.get<CloudinaryImageMetadata>(publicId, 'cloudinary', CloudinaryImageMetadataSchema)
    if (cached) return Ok(cached)

    console.log(`📥 Fetching Cloudinary image metadata from API for "${publicId}"`)

    // Fetch image details from Cloudinary Admin API
    const cloudinaryResponse = await cloudinaryClient.api
      .resource(publicId, {
        context: true, // include contextual metadata (alt, caption, plus any custom fields)
        type: publicId.startsWith('http') ? 'fetch' : 'upload',
      })
      .catch(error => {
        throw Error(`🚨 Error fetching Cloudinary image: "${publicId}":\n\n${getErrorDetails(error)}\n`)
      })

    // Validate response with Zod
    const parseResult = CloudinaryResourceSchema.safeParse(cloudinaryResponse)
    if (!parseResult.success) {
      const errors = formatValidationError(parseResult.error)
      throw new Error(ERRORS.INVALID_API_RESPONSE(publicId, errors))
    }

    const { public_id, width, height, context } = parseResult.data

    // Warn about missing alt text (soft failure)
    const alt = context?.custom?.alt
    if (!alt) {
      // TODO: restore strictness? I disabled it after a couple "/fetch/" gifs were missing all contextual metadata
      console.error(`🚨 Cloudinary image "${publicId}" is missing alt text in contextual metadata.`)
    }

    // Build metadata
    const metadata: CloudinaryImageMetadata = {
      alt: alt ?? '',
      caption: context?.custom?.caption ?? '',
      width,
      height,
      ...generateResponsiveImageUrls(public_id, cloudinaryClient),
    }

    // Cache result (dev mode only)
    await cache.set(publicId, metadata, 'cloudinary')

    return Ok(metadata)
  } catch (error) {
    return toErr(error, 'fetchCloudinaryImageMetadata')
  }
}

import { filesystemCache, type CacheAdapter } from '@/lib/cache/adapter'
import cloudinary, { type CloudinaryClient } from '@/lib/cloudinary/client'
import { getErrorDetails } from '@/utils/logging'
import parsePublicIdFromCloudinaryUrl from './parsePublicIdFromCloudinaryUrl'
import { Ok, toErr, type Result } from '@/utils/result'
import { z } from 'zod'

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
 * Fetches Cloudinary image metadata including alt text, caption, dimensions, and responsive image attributes.
 *
 */
export default async function fetchCloudinaryImageMetadata({
  url,
  cache = filesystemCache,
  cloudinaryClient = cloudinary,
}: Options): Promise<Result<CloudinaryImageMetadata, Error>> {
  try {
    const publicId = parsePublicIdFromCloudinaryUrl(url)
    if (!publicId) {
      throw new Error(`🚨 Could not parse Cloudinary public ID from URL: "${url}"`)
    }

    // Check cache first (dev mode only)
    const cached = await cache.get<CloudinaryImageMetadata>(
      publicId,
      'cloudinary',
      CloudinaryImageMetadataSchema,
    )
    if (cached) {
      return Ok(cached)
    }

    console.log(`📥 Fetching Cloudinary image metadata from API for "${publicId}"`)

    // Fetch image details from Cloudinary Admin API
    // See: https://cloudinary.com/documentation/admin_api#get_details_of_a_single_resource_by_public_id
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
      throw new Error(
        `🚨 Invalid Cloudinary API response for "${publicId}":\n${parseResult.error.message}`,
      )
    }

    const cloudinaryImage = parseResult.data

    const alt = cloudinaryImage.context?.custom?.alt

    if (!alt) {
      // TODO: restore strictness? I disabled it after a couple "/fetch/" gifs were missing all contextual metadata
      console.error(`🚨 Cloudinary image "${publicId}" is missing alt text in contextual metadata.`)
      // throw new Error(`🚨 Cloudinary image "${publicId}" is missing alt text in contextual metadata.`)
    }

    const caption = cloudinaryImage.context?.custom?.caption // comes from "Title" field in contextual metadata

    const { width, height } = cloudinaryImage

    // console.log(`✅ Fetched Cloudinary image metadata for "${url}"`)

    // TODO: separate into multiple functions: (1) fetch cloudinary image metadata from (2) update image metadata logic
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

    // Generate URL with desired transformations
    const src = cloudinaryClient.url(cloudinaryImage.public_id, {
      crop: 'scale',
      fetch_format: 'auto',
      quality: 'auto',
      width: 1440,
    })

    // Generate srcset attribute
    const srcSet = widths
      .map(
        width =>
          `${cloudinaryClient.url(cloudinaryImage.public_id, {
            crop: 'scale',
            fetch_format: 'auto',
            quality: 'auto',
            width,
          })} ${width}w`,
      )
      .join(', ')

    const sizes = '(min-width: 768px) 768px, 100vw'

    const metadata: CloudinaryImageMetadata = {
      alt: alt ?? '',
      caption: caption ?? '',
      height,
      sizes,
      src,
      srcSet,
      width,
    }

    // Cache the result (dev mode only)
    await cache.set(publicId, metadata, 'cloudinary')

    return Ok(metadata)
  } catch (error) {
    return toErr(error, 'fetchCloudinaryImageMetadata')
  }
}

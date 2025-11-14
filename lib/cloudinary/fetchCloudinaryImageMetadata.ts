import cloudinary from '@/lib/cloudinary/client'
import { type CloudinaryResource } from '@/lib/cloudinary/types'
import { getErrorDetails } from '@/utils/logging'
import parsePublicIdFromCloudinaryUrl from './parsePublicIdFromCloudinaryUrl'

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
 * Fetches Cloudinary image metadata including alt text, caption, dimensions, and responsive image attributes.
 *
 */
export default async function fetchCloudinaryImageMetadata(url: string): Promise<CloudinaryImageMetadata> {
  console.log(`📥 Fetching Cloudinary image metadata for "${url}"`)

  const publicId = parsePublicIdFromCloudinaryUrl(url)
  if (!publicId) {
    throw new Error(`🚨 Could not parse Cloudinary public ID from URL: "${url}"`)
  }
  console.log(`Parsed Cloudinary public ID: "${publicId}"`)

  // Fetch image details from Cloudinary Admin API
  // See: https://cloudinary.com/documentation/admin_api#get_details_of_a_single_resource_by_public_id
  const cloudinaryImage: CloudinaryResource = await cloudinary.api
    .resource(publicId, {
      context: true, // include contextual metadata (alt, caption, plus any custom fields)
      type: publicId.startsWith('http') ? 'fetch' : 'upload',
    })
    .catch(error => {
      throw Error(`🚨 Error fetching Cloudinary image: "${publicId}":\n\n${getErrorDetails(error)}\n`)
    })

  // TODO: parse image with zod (api uses type "object" for context and metadata)

  type CloudinaryImageContext = {
    custom: {
      alt?: string
      caption?: string
    }
  }

  const alt = (cloudinaryImage.context as CloudinaryImageContext)?.custom.alt // "custom" property currently defined as type "object" by sdk

  if (!alt) {
    // TODO: restore strictness? I disabled it after a couple "/fetch/" gifs were missing all contextual metadata
    console.error(`🚨 Cloudinary image "${publicId}" is missing alt text in contextual metadata.`)
    // throw new Error(`🚨 Cloudinary image "${publicId}" is missing alt text in contextual metadata.`)
  }

  const caption = (cloudinaryImage.context as CloudinaryImageContext)?.custom.caption // comes from "Title" field in contextual metadata

  const width = cloudinaryImage.width
  if (typeof width !== 'number') {
    throw new Error(`🚨 Cloudinary image "${publicId}" is missing width metadata.`)
  }

  const height = cloudinaryImage.height
  if (typeof height !== 'number') {
    throw new Error(`🚨 Cloudinary image "${publicId}" is missing height metadata.`)
  }

  console.log(`✅ Fetched Cloudinary image metadata for "${url}"`)

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
  const src = cloudinary.url(cloudinaryImage.public_id, {
    crop: 'scale',
    fetch_format: 'auto',
    quality: 'auto',
    width: 1440,
  })

  // Generate srcset attribute
  const srcSet = widths
    .map(
      width =>
        `${cloudinary.url(cloudinaryImage.public_id, {
          crop: 'scale',
          fetch_format: 'auto',
          quality: 'auto',
          width,
        })} ${width}w`,
    )
    .join(', ')

  const sizes = '(min-width: 768px) 768px, 100vw'

  return { alt, caption, height, sizes, src, srcSet, width }
}

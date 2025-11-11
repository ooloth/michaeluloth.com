import cloudinary from '../cloudinary/client'
import isCloudinaryMuImage from '../cloudinary/isCloudinaryUpload'
import findCachedResourceByPublicId from '../cloudinary/findPrefetchedResourceByPublicId'

const transformer = (): void => {
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

  // Mutate the image nodes with the image details
  if (!isCloudinaryMuImage(htmlImage.properties?.src as string)) {
    return // skip images I've already processed (this is a workaround for bug on my part)
  }

  const cloudinaryDetails = findCachedResourceByPublicId(htmlImage.properties?.src as string)

  const newSrc = cloudinary.url(cloudinaryDetails.public_id, {
    crop: 'scale',
    fetch_format: 'auto',
    quality: 'auto',
    width: 1440,
  })

  const newSrcset = widths
    .map(
      width =>
        `${cloudinary.url(cloudinaryDetails.public_id, {
          crop: 'scale',
          fetch_format: 'auto',
          quality: 'auto',
          width,
        })} ${width}w`,
    )
    .join(', ')

  const newSizes = '(min-width: 768px) 768px, 100vw'

  // @ts-expect-error: "custom" property currently defined as type "object"
  const newAlt = cloudinaryDetails?.context?.custom?.alt ?? ' ' // comes from "Description" field in contextual metadata
  const newWidth = cloudinaryDetails.width
  const newHeight = cloudinaryDetails.height
  const newLoading = cloudinaryDetails.loading
  const newDecoding = cloudinaryDetails.decoding

  // @ts-expect-error: "custom" property currently defined as type "object"
  const caption = cloudinaryDetails?.context?.custom?.caption // comes from "Title" field in contextual metadata

  if (caption) {
    // Create a new figure element
    const figure = {
      type: 'element',
      tagName: 'figure',
      properties: {},
      children: [
        {
          ...htmlImage,
          properties: {
            ...htmlImage.properties,
            src: newSrc,
            srcset: newSrcset,
            sizes: newSizes,
            alt: newAlt,
            width: newWidth,
            height: newHeight,
            loading: newLoading,
            decoding: newDecoding,
          },
        },
        {
          type: 'element',
          tagName: 'figcaption',
          children: [{ type: 'text', value: caption }],
        },
      ],
    }

    // Replace the image node with the figure node
    Object.assign(htmlImage, figure)
  } else {
    // Mutate the image node directly
    htmlImage.properties.src = newSrc
    htmlImage.properties.srcset = newSrcset
    htmlImage.properties.sizes = newSizes
    htmlImage.properties.alt = newAlt
    htmlImage.properties.width = newWidth
    htmlImage.properties.height = newHeight
    htmlImage.properties.loading = newLoading
    htmlImage.properties.decoding = newDecoding
  }
}

export default rehypeCloudinaryImageAttributes

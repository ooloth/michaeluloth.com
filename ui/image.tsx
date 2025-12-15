/* eslint-disable @next/next/no-img-element */
// TODO: handle non-Cloudinary images?

import fetchCloudinaryImageMetadata from '@/io/cloudinary/fetchCloudinaryImageMetadata'
import { type ImageEffect } from 'cloudinary'

const outerStylesDefault = 'my-6'
const imageStylesDefault = 'shadow-xl rounded bg-zinc-800'

type Props = Readonly<{
  loading?: 'eager' | 'lazy'
  url: string
  effect?: ImageEffect
  showCaption?: boolean
  imageStyles?: string
  outerStyles?: string
}>

/**
 * Fetches metadata for a Cloudinary image and renders it with optimization features.
 *
 * @throws Will throw an error if the provided URL is not a Cloudinary URL.
 * @returns A JSX element containing the optimized image, optionally wrapped in a figure with a caption.
 */
export default async function Image({ loading = 'eager', url, effect, showCaption, imageStyles, outerStyles }: Props) {
  if (!url.includes('cloudinary')) {
    throw new Error(`🚨 Image URL is not a Cloudinary URL: "${url}"`)
  }

  const { alt, caption, height, sizes, src, srcSet, width } = (
    await fetchCloudinaryImageMetadata({ url, effect })
  ).unwrap()

  const imageClasses = imageStyles ? `${imageStylesDefault} ${imageStyles}` : imageStylesDefault
  const outerClasses = outerStyles ? `${outerStylesDefault} ${outerStyles}` : outerStylesDefault

  const image = (
    <img
      alt={alt}
      height={height}
      loading={loading}
      sizes={sizes}
      src={src}
      srcSet={srcSet}
      width={width}
      className={imageClasses}
    />
  )

  return caption && showCaption ? (
    <figure className={outerClasses}>
      {image}
      <figcaption className="caption">{caption}</figcaption>
    </figure>
  ) : (
    <div className={outerClasses}>{image}</div>
  )
}

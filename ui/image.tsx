/* eslint-disable @next/next/no-img-element */

import transformCloudinaryImage from '@/lib/cloudinary/transformCloudinaryImage'

const outerStylesDefault = 'my-6'
const imageStylesDefault = 'shadow-xl rounded bg-zinc-800'

type Props = Readonly<{
  alt: string
  caption?: string
  height: number
  src: string
  width: number
  imageStyles?: string
  outerStyles?: string
}>

// TODO: handle Cloudinary and non-Cloudinary images differently
export default function Image({ alt, caption, height, src, width, imageStyles, outerStyles }: Props) {
  const imageClasses = imageStyles ? `${imageStylesDefault} ${imageStyles}` : imageStylesDefault
  const outerClasses = outerStyles ? `${outerStylesDefault} ${outerStyles}` : outerStylesDefault

  const image = (
    <img src={transformCloudinaryImage(src, 624)} alt={alt} width={width} height={height} className={imageClasses} />
  )

  return caption ? (
    <figure className={outerClasses}>
      {image}
      <figcaption>{caption}</figcaption>
    </figure>
  ) : (
    <div className={outerClasses}>{image}</div>
  )
}

/* eslint-disable @next/next/no-img-element */

import transformCloudinaryImage from '@/lib/cloudinary/transformCloudinaryImage'

const outerStyles = 'mt-6 rounded-lg'
const imageStyles = 'bg-zinc-800'

type Props = Readonly<{
  alt: string
  caption?: string
  height: number
  src: string
  width: number
}>

// TODO: handle Cloudinary and non-Cloudinary images differently
export default function Image({ alt, caption, height, src, width }: Props) {
  const image = (
    <img src={transformCloudinaryImage(src, 624)} alt={alt} width={width} height={height} className={imageStyles} />
  )

  return caption ? (
    <figure className={outerStyles}>
      {image}
      <figcaption>{caption}</figcaption>
    </figure>
  ) : (
    <div className={outerStyles}>{image}</div>
  )
}

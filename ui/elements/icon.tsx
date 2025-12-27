/**
 * A component for rendering monochrome SVG icons using the current text color.
 * @see: https://github.com/vitalets/turbopack-inline-svg-loader?tab=readme-ov-file#how-to-change-color
 */
import { type ComponentProps } from 'react'
import { type StaticImageData } from 'next/image'

type IconProps = Omit<ComponentProps<'img'>, 'src'> & {
  src: StaticImageData
}

const EMPTY_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E`

export default function Icon({ src, width, height, style, ...props }: IconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      width={width ?? src.width}
      height={height ?? src.height}
      src={EMPTY_SVG}
      alt="" // treat as decorative so screen readers ignore it
      style={{
        ...style,
        backgroundColor: `currentcolor`,
        mask: `url("${src.src}") no-repeat center / contain`,
      }}
      {...props}
    />
  )
}

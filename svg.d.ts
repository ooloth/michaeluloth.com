// See: https://github.com/vitalets/turbopack-inline-svg-loader?tab=readme-ov-file#typescript

declare module '*.svg' {
  const content: import('next/image').StaticImageData
  export default content
}

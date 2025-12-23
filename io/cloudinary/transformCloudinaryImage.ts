/**
 * Transforms a Cloudinary URL to include optimization parameters.
 * Inserts width, format, and quality parameters into the URL.
 * Supports upload/, fetch/, and youtube/ transformation types.
 *
 * Note: DPR is handled via srcset in the component, not hardcoded here.
 */
export default function transformCloudinaryImage(url: string, width: number): string {
  if (url.includes('cloudinary')) {
    if (url.includes('upload/')) {
      return url.replace('upload/', `upload/w_${width},f_auto,q_auto/`)
    }
    if (url.includes('fetch/')) {
      return url.replace('fetch/', `fetch/w_${width},f_auto,q_auto/`)
    }
    if (url.includes('youtube/')) {
      return url.replace('youtube/', `youtube/w_${width},f_auto,q_auto/`)
    }
  }

  return url
}

import { type ReactElement } from 'react'

const outerStylesDefault = 'my-6'
const videoStylesDefault = 'shadow-xl rounded bg-zinc-800 w-full'
const iframeStylesDefault = 'shadow-xl rounded bg-zinc-800 w-full aspect-video'

type Props = Readonly<{
  url: string
  caption: string | null
  videoStyles?: string
  outerStyles?: string
}>

/**
 * Extracts YouTube video ID from various YouTube URL formats.
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/embed/, etc.
 */
function getYouTubeVideoId(url: string): string | null {
  const pattern = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  const match = url.match(pattern)
  return match?.[1] ?? null
}

/**
 * Checks if a URL is a YouTube URL.
 */
function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

/**
 * Renders a video element with optional caption.
 * Automatically detects YouTube URLs and renders them as iframes.
 * Other video URLs are rendered as HTML5 video elements.
 *
 * @example
 * // YouTube video with caption
 * <Video url="https://youtube.com/watch?v=abc123" caption="Tutorial" />
 *
 * @example
 * // Direct video file without caption
 * <Video url="https://example.com/video.mp4" caption={null} />
 *
 * @returns A JSX element containing the video, optionally wrapped in a figure with a caption.
 */
export default function Video({ url, caption, videoStyles, outerStyles }: Props): ReactElement {
  const outerClasses = outerStyles ? `${outerStylesDefault} ${outerStyles}` : outerStylesDefault

  let videoElement: ReactElement

  if (isYouTubeUrl(url)) {
    const videoId = getYouTubeVideoId(url)
    if (!videoId) {
      throw new Error(`Failed to extract YouTube video ID from URL: ${url}`)
    }

    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`
    const iframeClasses = videoStyles ? `${iframeStylesDefault} ${videoStyles}` : iframeStylesDefault

    videoElement = (
      <iframe
        src={embedUrl}
        title={caption || 'YouTube video'}
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        sandbox="allow-scripts allow-same-origin allow-presentation"
        loading="lazy"
        allowFullScreen
        className={iframeClasses}
      />
    )
  } else {
    const videoClasses = videoStyles ? `${videoStylesDefault} ${videoStyles}` : videoStylesDefault

    videoElement = (
      <video controls preload="metadata" playsInline className={videoClasses}>
        <source src={url} />
        Your browser does not support the video tag.
      </video>
    )
  }

  return caption ? (
    <figure className={outerClasses}>
      {videoElement}
      <figcaption className="caption">{caption}</figcaption>
    </figure>
  ) : (
    <div className={outerClasses}>{videoElement}</div>
  )
}

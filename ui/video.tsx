import { type ReactElement } from 'react'

const outerStylesDefault = 'my-6'
const videoStylesDefault = 'shadow-xl rounded bg-zinc-800 w-full'
const iframeStylesDefault = 'shadow-xl rounded bg-zinc-800 w-full aspect-video'

type Props = Readonly<{
  url: string
  showCaption?: boolean
  caption?: string
  videoStyles?: string
  outerStyles?: string
}>

/**
 * Extracts YouTube video ID from various YouTube URL formats.
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/embed/, etc.
 */
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
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
 * @returns A JSX element containing the video, optionally wrapped in a figure with a caption.
 */
export default function Video({ url, showCaption, caption, videoStyles, outerStyles }: Props) {
  const outerClasses = outerStyles ? `${outerStylesDefault} ${outerStyles}` : outerStylesDefault

  let videoElement: ReactElement

  if (isYouTubeUrl(url)) {
    const videoId = getYouTubeVideoId(url)
    if (!videoId) {
      console.error(`Failed to extract YouTube video ID from URL: ${url}`)
      return <div className={outerClasses}>Unable to load video</div>
    }

    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`
    const iframeClasses = videoStyles ? `${iframeStylesDefault} ${videoStyles}` : iframeStylesDefault

    videoElement = (
      <iframe
        src={embedUrl}
        title={caption || 'YouTube video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className={iframeClasses}
      />
    )
  } else {
    const videoClasses = videoStyles ? `${videoStylesDefault} ${videoStyles}` : videoStylesDefault

    videoElement = (
      <video controls className={videoClasses}>
        <source src={url} />
        Your browser does not support the video tag.
      </video>
    )
  }

  return caption && showCaption ? (
    <figure className={outerClasses}>
      {videoElement}
      <figcaption className="caption">{caption}</figcaption>
    </figure>
  ) : (
    <div className={outerClasses}>{videoElement}</div>
  )
}
